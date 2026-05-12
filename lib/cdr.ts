import { z } from "zod";

export const claimInputSchema = z.object({
  customerComplaint: z.string().trim().min(1, "Original customer complaint is required."),
  technicianWriteup: z.string().trim().min(1, "Technician write-up is required."),
  workorderTime: z.string().trim().min(1, "Workorder time to collect is required."),
});

export type ClaimInput = z.infer<typeof claimInputSchema>;

export type CoverageLabel =
  | "BASIC WARRANTY"
  | "EMISSIONS WARRANTY"
  | "POWERGARD COMPREHENSIVE"
  | "EXTENDED WARRANTY";

export type CdrStep = {
  description: string;
  timeHours: number | null;
};

export type CdrResult = {
  coverageLabel: CoverageLabel;
  keyPartNumber: string;
  cause: string;
  diagnose: CdrStep[];
  repair: CdrStep[];
  cleanUp: CdrStep[];
  workorderTimeRequested: number | null;
  claimableTime: number;
  timeDifference: number | null;
  warnings: string[];
  sourceNotes: string[];
  copyText: string;
};

const diagnosticKeywords = [
  "diagnos",
  "service advisor",
  "fault code",
  "code",
  "test",
  "pressure",
  "flow",
  "continuity",
  "multimeter",
  "calibrat",
  "verify",
  "validated",
  "inspect",
  "checked",
  "troubleshoot",
];

const repairKeywords = [
  "repair",
  "replace",
  "installed",
  "install",
  "removed",
  "remove",
  "adjust",
  "reprogram",
  "updated",
  "torque",
  "reassemble",
  "assembled",
  "cleared",
  "returned to service",
];

const cleanupKeywords = ["clean", "cleanup", "wash", "washed", "flushed", "flush", "caddy", "caddying"];
const fluidKeywords = ["oil", "hydraulic", "coolant", "fuel", "fluid", "leak"];

const nonClaimableDiagnosticKeywords = [
  "dtac case",
  "parts list",
  "estimate",
  "searched dtac",
  "visual inspection",
  "visual oil inspection",
  "oil sample",
  "obvious failure",
];

export function generateCdr(input: ClaimInput): CdrResult {
  const sentences = splitIntoSteps(input.technicianWriteup);
  const diagnose: CdrStep[] = [];
  const repair: CdrStep[] = [];
  const cleanUp: CdrStep[] = [];
  const warnings: string[] = [];

  for (const sentence of sentences) {
    const step = toStep(sentence);
    const lower = sentence.toLowerCase();

    if (matchesAny(lower, cleanupKeywords)) {
      cleanUp.push(step);
      continue;
    }

    if (matchesAny(lower, repairKeywords)) {
      repair.push(step);
      continue;
    }

    if (matchesAny(lower, diagnosticKeywords)) {
      diagnose.push(step);
      continue;
    }

    diagnose.push(step);
  }

  const workorderTimeRequested = parseHours(input.workorderTime);
  const keyPartNumber = extractKeyPartNumber(input.technicianWriteup);
  const cause = extractCause(input.technicianWriteup);
  if (!/\b(basic|emissions?|powergard|extended)\b/i.test(`${input.customerComplaint}\n${input.technicianWriteup}`)) {
    warnings.push("Coverage type was not found in the pasted notes. Verify Basic, Emissions, PowerGard, or Extended coverage before submission.");
  }

  const coverageLabel = inferCoverageLabel(`${input.customerComplaint}\n${input.technicianWriteup}`);

  const sourceNotes = [
    "WAM 110.12 requires sufficient detail for Complaint, Diagnostics, and Repair and limits labor to actual technician timecard hours.",
    "WAM 110.14 requires diagnostic labor to be supported in the Diagnostics field with diagnostic methods, tools, and procedures.",
    "WAM 110.16 allows clean up labor only when there is fluid loss and washing the area is necessary to complete the repair.",
    "CDR transition guide requires Complaint, Diagnostics, and Repair detail instead of the legacy 3Cs format.",
  ];

  addLaborWarnings("Diagnose", diagnose, warnings);
  addLaborWarnings("Repair", repair, warnings);
  addLaborWarnings("Clean up", cleanUp, warnings);
  addPolicyWarnings(sentences, warnings);

  const claimableTime = roundHours(sumHours(diagnose) + sumHours(repair) + eligibleCleanupHours(cleanUp, warnings));
  const timeDifference =
    workorderTimeRequested === null ? null : roundHours(workorderTimeRequested - claimableTime);

  if (workorderTimeRequested === null) {
    warnings.push("Workorder time could not be parsed as hours. Enter a numeric hour value such as 2.4.");
  } else if (Math.abs(timeDifference ?? 0) > 0.05) {
    warnings.push(
      `Requested workorder time (${workorderTimeRequested.toFixed(
        1,
      )} hr) does not match currently claimable CDR time (${claimableTime.toFixed(
        1,
      )} hr). Clarify claimable versus non-claimable time before submission.`,
    );
  }

  if (!keyPartNumber) {
    warnings.push("No clear key part number was found; the CDR key part field is intentionally blank.");
  }

  const resultWithoutCopy = {
    coverageLabel,
    keyPartNumber,
    cause,
    diagnose,
    repair,
    cleanUp,
    workorderTimeRequested,
    claimableTime,
    timeDifference,
    warnings,
    sourceNotes,
  };

  return {
    ...resultWithoutCopy,
    copyText: buildCopyText(resultWithoutCopy),
  };
}

function splitIntoSteps(text: string): string[] {
  return text
    .split(/\n|(?:\.\s+)/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function toStep(description: string): CdrStep {
  return {
    description: removeTimeFragments(description),
    timeHours: parseHours(description),
  };
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseHours(text: string): number | null {
  const normalized = text.toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours|h)\b/);
  if (hourMatch) {
    return Number(hourMatch[1]);
  }

  const plainNumber = normalized.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (plainNumber) {
    return Number(plainNumber[1]);
  }

  const minutesMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/);
  if (minutesMatch) {
    return roundHours(Number(minutesMatch[1]) / 60);
  }

  return null;
}

function removeTimeFragments(text: string): string {
  return text
    .replace(/\(?\b\d+(?:\.\d+)?\s*(?:hr|hrs|hour|hours|h|min|mins|minute|minutes)\b\)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractKeyPartNumber(text: string): string {
  const match = text.match(/\b(?:part|p\/n|pn|part number)\s*[:#-]?\s*([A-Z]{1,4}\d{3,}[A-Z0-9-]*)\b/i);
  return match?.[1]?.toUpperCase() ?? "";
}

function extractCause(text: string): string {
  const failedMatch = text.match(
    /\b(?:cause|caused by|found|verified|confirmed)\s*[:\-]?\s*([^.\n]{8,140})/i,
  );
  if (failedMatch?.[1]) {
    return cleanCause(failedMatch[1]);
  }

  const failureMatch = text.match(/\b(failed|faulty|leaking|leak|shorted|open|broken|cracked|stuck)\b([^.\n]{0,120})/i);
  if (failureMatch) {
    return cleanCause(`${failureMatch[1]}${failureMatch[2] ?? ""}`);
  }

  return "Failure cause not clearly identified from technician write-up";
}

function cleanCause(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function addLaborWarnings(section: string, steps: CdrStep[], warnings: string[]) {
  if (steps.length === 0) {
    warnings.push(`${section} section has no extracted steps. Add detail before submission if this section applies.`);
    return;
  }

  for (const step of steps) {
    if (step.timeHours === null) {
      warnings.push(`${section} step is missing time: "${step.description}".`);
    }
  }
}

function addPolicyWarnings(sentences: string[], warnings: string[]) {
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (matchesAny(lower, nonClaimableDiagnosticKeywords)) {
      warnings.push(`Potentially non-claimable diagnostic activity detected: "${sentence}".`);
    }
  }
}

function eligibleCleanupHours(cleanUp: CdrStep[], warnings: string[]): number {
  const cleanupHours = sumHours(cleanUp);
  const cleanupHasFluidContext = cleanUp.some((step) => matchesAny(step.description.toLowerCase(), fluidKeywords));

  if (cleanupHours > 0 && !cleanupHasFluidContext) {
    warnings.push(
      "Clean up time was found, but no fluid-loss context was detected. WAM 110.16 requires fluid loss and washing the area as necessary to complete the repair.",
    );
    return 0;
  }

  if (cleanupHours > 0.5) {
    warnings.push(
      `Clean up time totals ${cleanupHours.toFixed(
        1,
      )} hr. Normal dealer operating rule caps clean up at 0.5 hr unless a source-specific rule applies.`,
    );
    return 0.5;
  }

  return cleanupHours;
}

function sumHours(steps: CdrStep[]): number {
  return roundHours(steps.reduce((total, step) => total + (step.timeHours ?? 0), 0));
}

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

function coverageBanner(label: CoverageLabel): string {
  const map: Record<CoverageLabel, string> = {
    "BASIC WARRANTY": "🟩 BASIC WARRANTY",
    "EMISSIONS WARRANTY": "🟦 EMISSIONS WARRANTY",
    "POWERGARD COMPREHENSIVE": "🟨 POWERGARD COMPREHENSIVE",
    "EXTENDED WARRANTY": "🟥 EXTENDED WARRANTY",
  };
  return map[label];
}

function inferCoverageLabel(text: string): CoverageLabel {
  const lower = text.toLowerCase();
  if (/\bpowergard\b/i.test(text) || /\bcomprehensive\b/i.test(lower)) {
    return "POWERGARD COMPREHENSIVE";
  }
  if (/\bemissions?\b/i.test(lower)) {
    return "EMISSIONS WARRANTY";
  }
  if (/\bextended\b/i.test(lower)) {
    return "EXTENDED WARRANTY";
  }
  return "BASIC WARRANTY";
}

function buildCopyText(result: Omit<CdrResult, "copyText">): string {
  return [
    coverageBanner(result.coverageLabel),
    "",
    `Key part number: ${result.keyPartNumber}`,
    `Cause: ${result.cause}`,
    "Diagnose:",
    ...formatSteps(result.diagnose),
    "Repair:",
    ...formatSteps(result.repair),
    "Clean up:",
    ...formatSteps(result.cleanUp),
  ].join("\n");
}

function formatSteps(steps: CdrStep[]): string[] {
  if (steps.length === 0) {
    return [""];
  }

  return steps.map((step) => {
    const time = step.timeHours === null ? "time needed" : `${step.timeHours.toFixed(1)} hr`;
    return `- ${step.description}: ${time}`;
  });
}
