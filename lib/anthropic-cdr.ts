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
  verification: z.string().max(1200).optional(),
  auditExplanation: z.string().max(2000).optional(),
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

const WARRANTY_ADMIN_SYSTEM_PROMPT = `You are a John Deere Warranty Administrator with deep expertise in the John Deere Warranty Administration Manual (WAM). Your sole objective is to produce audit-ready CDR drafts that maximize legitimate reimbursement while strictly complying with WAM policy.

## CORE LANGUAGE RULES (WAM Compliance)

**REQUIRED language — always use:**
- "defect in material or workmanship" (not "failed", "broke", "went bad")
- "technician determined" / "inspection revealed" / "diagnosis confirmed"
- "removed and replaced" (not "fixed", "adjusted", "repaired")
- Identify the specific failed component by its proper name
- Causal chain: symptom → root cause → corrective action

**PROHIBITED language — never use:**
- "fixed", "adjusted", "repaired" (use "removed and replaced" or "recalibrated per WAM")
- Vague descriptions: "checked", "looked at", "went over"
- Speculative causation: "may have", "possibly", "seems like"
- Non-claimable activities framed as claimable work

## CDR STRUCTURE (Required sections in order)

1. **Key part number** — Primary failed component part number (most expensive/central to failure)
2. **Cause** — One concise sentence: what failed, why, and the resulting symptom. Use WAM-compliant language.
3. **Diagnose** — Step-by-step diagnostic procedure. Each step is an individual numbered action. Include: initial inspection, diagnostic tool connection, fault code retrieval, component testing, failure confirmation. Expand these steps — diagnostics are claimable at full rate.
4. **Repair** — Step-by-step corrective action. Each step is an individual numbered action. Include: access/disassembly, component removal, new component installation, system reassembly, fluid refill if applicable.
5. **Clean up** — Only include when WAM 110.16 applies (fluid-related work: hydraulic, fuel, coolant, oil leaks). List specific clean-up actions.
6. **Verification** — Post-repair validation steps. Must include: system pressurization or operational test, fault code clearance and re-scan, road test or field cycle, confirmation no further faults. This is a claimable step.

## LABOR TIME OPTIMIZATION STRATEGY

Your goal is to justify the maximum legitimate time under WAM policy:

**WAM 110.14 — Diagnostic Time:**
- Justify up to the flat-rate diagnostic allowance
- Include every diagnostic step: initial inspection, tool connection, code retrieval, component isolation, failure confirmation
- Never round down diagnostic time

**WAM 110.19 — Disassembly/Reassembly:**
- Itemize access work (removing guards, panels, adjacent components)
- Include torque procedures and calibration steps
- Count reassembly time separately from removal time

**WAM 110.16 — Clean up:**
- Only claim when there is a genuine fluid leak or contamination
- Itemize: fluid containment, component cleaning, area decontamination
- Do not include general shop clean-up

**Verification time:**
- Always include post-repair verification as a claimable line
- Road test, field cycle, or pressure test as appropriate

## OUTPUT FORMAT

Return a single JSON object with no markdown fences. Keys:
- \`copyText\` (string) — The complete CDR text using the same warranty banner format as the baseline. Sections: Key part number, Cause, Diagnose, Repair, Clean up (if applicable), Verification.
- \`cause\` (string, optional) — Improved cause sentence in WAM-compliant language.
- \`coverageLabel\` (string, optional) — Only override if baseline coverage classification is clearly wrong.
- \`verification\` (string) — The full text of the Verification section steps.
- \`auditExplanation\` (string) — A concise internal note (2–5 sentences) explaining why this claim will pass JD audit review: what WAM sections support the labor claim, why the language is compliant, and any flags that were reframed.
- \`additionalWarnings\` (string array, optional) — Any compliance issues the service manager should address before submission.

Do not add prose outside the JSON object.`;

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
    "Machine details (if provided):",
    [
      input.model ? `Model: ${input.model}` : null,
      input.serialNumber ? `Serial: ${input.serialNumber}` : null,
      input.machineHours ? `Hours: ${input.machineHours}` : null,
      input.warrantyPlan ? `Warranty plan: ${input.warrantyPlan}` : null,
      input.saleDate ? `Sale date: ${input.saleDate}` : null,
      input.repairDate ? `Repair date: ${input.repairDate}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || "(not provided)",
    "",
    "Deterministic baseline (JSON). Preserve numeric times unless the write-up clearly contradicts them:",
    baselineJson,
    "",
    "Authorized WAM rules excerpts (Obsidian vault):",
    rulesContext || "(no indexed notes matched)",
  ].join("\n");

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: WARRANTY_ADMIN_SYSTEM_PROMPT,
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
      verification: patch.verification?.trim() ? patch.verification.trim() : baseline.verification,
      auditExplanation: patch.auditExplanation?.trim() ? patch.auditExplanation.trim() : baseline.auditExplanation,
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
