import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import type { ClaimInput, CdrResult, CoverageLabel } from "@/lib/cdr";
import { getRelevantWarrantySourceNotes } from "@/lib/warranty-rules";

const refinementSchema = z.object({
  copyText: z.string().min(20),
  coverageLabel: z
    .enum(["BASIC WARRANTY", "EMISSIONS WARRANTY", "POWERGARD COMPREHENSIVE", "EXTENDED WARRANTY"])
    .optional(),
  cause: z.string().max(800).optional(),
  additionalWarnings: z.array(z.string()).max(20).optional(),
});

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) {
    return fence[1].trim();
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function aiCopyTextLooksStructured(copyText: string): boolean {
  const lower = copyText.toLowerCase();
  return (
    copyText.includes("Key part number:") &&
    copyText.includes("Cause:") &&
    lower.includes("diagnose") &&
    lower.includes("repair")
  );
}

export function anthropicCdrEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function refineCdrWithAnthropic(input: ClaimInput, baseline: CdrResult): Promise<CdrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return baseline;
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022";
  const notes = await getRelevantWarrantySourceNotes(input, baseline);
  const rulesContext = notes
    .map((n) => `### ${n.title} (${n.path})\n${n.body.slice(0, 3500)}`)
    .join("\n\n---\n\n")
    .slice(0, 24000);

  const client = new Anthropic({ apiKey });

  const baselineJson = JSON.stringify(
    {
      coverageLabel: baseline.coverageLabel,
      keyPartNumber: baseline.keyPartNumber,
      cause: baseline.cause,
      diagnose: baseline.diagnose,
      repair: baseline.repair,
      cleanUp: baseline.cleanUp,
      claimableTime: baseline.claimableTime,
      workorderTimeRequested: baseline.workorderTimeRequested,
      copyText: baseline.copyText,
      warnings: baseline.warnings,
    },
    null,
    2,
  );

  const userBlock = [
    "Original customer complaint:",
    input.customerComplaint,
    "",
    "Technician write-up:",
    input.technicianWriteup,
    "",
    "Workorder time (hours to collect):",
    input.workorderTime,
    "",
    "Deterministic baseline (JSON). Preserve numeric times unless the write-up clearly contradicts them.",
    baselineJson,
  ].join("\n");

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: [
        "You are a John Deere dealership warranty administrator.",
        "Improve the CDR draft to dealer-grade clarity and John Deere CDR structure (Key part number, Cause, Diagnose, Repair, Clean up).",
        "Follow the authorized rules excerpts below; do not invent warranty coverage—use only what the notes support.",
        "If cleanup is not allowed under WAM 110.16 (no fluid-related context), omit clean up lines or leave that section blank as appropriate.",
        "Output a single JSON object only, no markdown fences, with keys: copyText (string), optional coverageLabel, optional cause, optional additionalWarnings (string array).",
        "copyText must use the same warranty banner line style as the baseline (emoji + coverage name on the first line).",
        "Do not add prose outside JSON.",
        "",
        "Authorized rules excerpts (Obsidian vault):",
        rulesContext || "(no indexed notes matched)",
      ].join("\n"),
      messages: [{ role: "user", content: userBlock }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return withAnthropicFailureWarning(baseline, "Anthropic returned no text block.");
    }

    const rawJson = extractJsonObject(textBlock.text);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      return withAnthropicFailureWarning(baseline, "Anthropic returned invalid JSON.");
    }

    const parsed = refinementSchema.safeParse(parsedJson);

    if (!parsed.success) {
      return withAnthropicFailureWarning(baseline, "Anthropic JSON did not match the expected schema.");
    }

    const patch = parsed.data;
    if (!aiCopyTextLooksStructured(patch.copyText)) {
      return withAnthropicFailureWarning(baseline, "Anthropic copyText failed structure validation.");
    }

    const coverageLabel = (patch.coverageLabel ?? baseline.coverageLabel) as CoverageLabel;

    return {
      ...baseline,
      coverageLabel,
      cause: patch.cause?.trim() ? patch.cause.trim() : baseline.cause,
      copyText: patch.copyText.trim(),
      warnings: [
        ...baseline.warnings,
        ...(patch.additionalWarnings ?? []),
        "CDR copy text was refined using Anthropic Claude; verify before submission.",
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return withAnthropicFailureWarning(baseline, `Anthropic refinement failed: ${message}`);
  }
}

function withAnthropicFailureWarning(baseline: CdrResult, warning: string): CdrResult {
  return {
    ...baseline,
    warnings: [...baseline.warnings, warning],
  };
}
