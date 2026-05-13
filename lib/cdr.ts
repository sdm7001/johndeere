import { z } from "zod";

export const claimInputSchema = z.object({
  customerComplaint: z.string().trim().min(1, "Original customer complaint is required."),
  technicianWriteup: z.string().trim().min(1, "Technician write-up is required."),
  workorderTime: z.string().trim().min(1, "Workorder time to collect is required."),
  // Machine / equipment details (all optional — warn when missing)
  machineModel: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  machineHours: z.string().trim().optional(),
  saleDate: z.string().trim().optional(),
  warrantyPlan: z.string().trim().optional(),
  repairDate: z.string().trim().optional(),
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
  verification: string;
  auditExplanation: string;
  workorderTimeRequested: number | null;
  claimableTime: number;
  timeDifference: number | null;
  warnings: string[];
  sourceNotes: string[];
  copyText: string;
};

export type CdrDenialReason = "customer_pay" | "accidental_damage" | "scheduled_maintenance" | "cosmetic_damage";

export type CdrDenialResult = {
  denied: true;
  reason: CdrDenialReason;
  explanation: string;
  wamCitations: string[];
  alternatives: string[];
  specialAllowanceNote: string | null;
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

// ---------------------------------------------------------------------------
// Non-covered detection — must run before CDR generation
// ---------------------------------------------------------------------------

const customerPayKeywords = [
  "customer pay",
  "customer-pay",
  "c-pay",
  "cpay",
  "retail pay",
  "owner pay",
  "customer responsibility",
  "not warranty",
  "non-warranty",
  "out of warranty",
];

const accidentalDamageKeywords = [
  "accident",
  "collision",
  "impact damage",
  "ran into",
  "hit a",
  "vandalism",
  "vandalized",
  "misuse",
  "operator abuse",
  "operator damage",
  "customer damage",
  "customer damaged",
  "operator error caused",
];

const scheduledMaintenanceKeywords = [
  "oil change",
  "scheduled maintenance",
  "pm service",
  "preventive maintenance",
  "routine service",
  "routine maintenance",
  "annual service",
  "annual maintenance",
  "50 hour",
  "100 hour",
  "250 hour",
  "500 hour",
];

const failureKeywords = [
  "fail",
  "broke",
  "broken",
  "crack",
  "leak",
  "fault code",
  "warning light",
  "warning lamp",
  "defect",
  "malfunction",
  "seized",
  "stuck",
  "shorted",
  "open circuit",
  "overheated",
  "overheating",
];

const cosmeticKeywords = ["paint chip", "scratch", "cosmetic", "dent", "rust", "fading", "discolor"];

export function checkCoverageEligibility(input: ClaimInput): CdrDenialResult | null {
  const combined = `${input.customerComplaint}\n${input.technicianWriteup}`.toLowerCase();

  // Customer-pay / non-warranty flag
  if (matchesAny(combined, customerPayKeywords)) {
    return {
      denied: true,
      reason: "customer_pay",
      explanation:
        "The notes indicate this repair was designated as customer-pay or non-warranty. John Deere warranty reimburses only covered failures during the applicable warranty period; customer-pay work is not eligible for CDR submission.",
      wamCitations: [
        "WAM 110.1 — Warranty coverage applies only to failures occurring during the applicable warranty period and does not extend to customer-elected or customer-pay repairs.",
        "WAM 110.3 — The dealer must obtain customer authorization for non-warranty work; submitting customer-pay repair time as warranty labor is not permitted.",
      ],
      alternatives: [
        "If the failure is warrantable but the customer was charged in error, void the customer invoice, document the covered failure, and submit as warranty.",
        "If only part of the repair is warranty-eligible, split the workorder and submit only the warrantable portion.",
        "Special Allowance (D-Policy) may be available if the machine is slightly out of warranty period and the failure is otherwise warrantable — contact your Deere Warranty zone contact.",
      ],
      specialAllowanceNote:
        "If this repair is related to a known product issue, a Special Allowance or D-Policy authorization may allow reimbursement. Contact your Deere zone warranty rep.",
    };
  }

  // Accidental or operator damage
  if (matchesAny(combined, accidentalDamageKeywords)) {
    return {
      denied: true,
      reason: "accidental_damage",
      explanation:
        "The notes indicate damage caused by accident, collision, misuse, or operator error. John Deere warranty does not cover damage resulting from accidents, operator abuse, negligence, unauthorized modifications, or external causes.",
      wamCitations: [
        "WAM 110.2 — Warranty does not apply to damage caused by accident, misuse, neglect, improper operation, improper storage, or unauthorized modification.",
        "WAM 110.2 — External damage from collision, impact, or operator error is not covered under any standard John Deere warranty plan.",
      ],
      alternatives: [
        "File a claim with the customer's equipment insurance if the damage resulted from an insured event.",
        "If the machine has an extended protection plan (PowerGard or similar), verify whether accidental damage coverage was included — some plans offer this as an add-on.",
        "For damage adjacent to a warrantable failure (e.g., a component damaged by a separate covered leak), separate the warrantable portion and submit only that portion.",
      ],
      specialAllowanceNote: null,
    };
  }

  // Cosmetic damage as sole complaint
  if (matchesAny(combined, cosmeticKeywords) && !matchesAny(combined, failureKeywords)) {
    return {
      denied: true,
      reason: "cosmetic_damage",
      explanation:
        "The complaint appears to be limited to cosmetic issues (paint, scratches, dents, or surface rust) with no documented functional failure. John Deere warranty covers functional defects; cosmetic blemishes that do not affect machine operation are generally excluded.",
      wamCitations: [
        "WAM 110.2 — Cosmetic defects that do not impair the mechanical or functional operation of the machine are not covered under standard warranty.",
        "WAM 110.5 — Surface rust, minor paint defects, and normal weathering are excluded from warranty coverage.",
      ],
      alternatives: [
        "If the cosmetic issue is the result of a covered failure (e.g., a hydraulic leak caused paint damage), document the root cause and submit the warrantable failure — note the cosmetic consequence in the write-up.",
        "Contact your Deere zone rep regarding paint or finish campaigns for known product quality issues.",
        "D-Policy or goodwill consideration may apply for cosmetic issues on low-hour machines within a reasonable time of delivery.",
      ],
      specialAllowanceNote:
        "For new machines with cosmetic defects present at or near delivery, contact your Deere zone representative regarding pre-delivery inspection (PDI) policy or goodwill support.",
    };
  }

  // Scheduled maintenance ONLY (no failure keywords)
  if (matchesAny(combined, scheduledMaintenanceKeywords) && !matchesAny(combined, failureKeywords)) {
    return {
      denied: true,
      reason: "scheduled_maintenance",
      explanation:
        "The notes describe scheduled or routine maintenance only, with no documented functional failure. John Deere warranty covers defects in materials and workmanship; routine maintenance services (oil changes, filter replacements, lubrication, and scheduled inspections) are the owner's responsibility and are not reimbursable.",
      wamCitations: [
        "WAM 110.4 — Scheduled maintenance and normal wear items are the owner's responsibility and are not covered under warranty.",
        "WAM 110.4 — Engine oil, filters, greasing, lubrication, and routine adjustments required by the operator's manual are maintenance items excluded from warranty reimbursement.",
      ],
      alternatives: [
        "If the maintenance revealed a covered failure (e.g., an oil change discovered a failed oil cooler), document the failure separately and submit a warranty claim for the repair — the maintenance labor itself remains non-claimable.",
        "PowerGard Comprehensive and some extended plans include maintenance coverage — verify the specific plan terms with your Deere zone rep or the customer's coverage documents.",
        "If a Deere Technical Assistance bulletin (DTAC) required an off-interval service or special maintenance procedure to correct a defect, that bulletin-directed service may be warranty-eligible — retrieve the DTAC number and cite it in the CDR.",
      ],
      specialAllowanceNote:
        "If a DTAC or Product Improvement Program (PIP) directed this maintenance as a fix for a known defect, it may qualify for reimbursement. Locate and cite the DTAC number before submitting.",
    };
  }

  return null;
}

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

  // Warn on missing machine details required by the SOP
  if (!input.machineModel?.trim()) {
    warnings.push("Machine model not provided. Add model before submission.");
  }
  if (!input.serialNumber?.trim()) {
    warnings.push("Serial number not provided. Required for claim submission.");
  }
  if (!input.machineHours?.trim()) {
    warnings.push("Machine hours not provided. Required to verify coverage eligibility.");
  }
  if (!input.saleDate?.trim()) {
    warnings.push("Sale date not provided. Required to verify warranty period.");
  }
  if (!input.warrantyPlan?.trim()) {
    warnings.push("Warranty plan not provided. Confirm coverage type (Basic, PowerGard, etc.).");
  }
  if (!input.repairDate?.trim()) {
    warnings.push("Repair date not provided. Required for claim submission.");
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
    verification: "",
    auditExplanation: "",
    workorderTimeRequested,
    claimableTime,
    timeDifference,
    warnings,
    sourceNotes,
  };

  return {
    ...resultWithoutCopy,
    copyText: buildCopyText(resultWithoutCopy, input),
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

function buildCopyText(result: Omit<CdrResult, "copyText">, input?: ClaimInput): string {
  const machineHeader: string[] = [];
  if (input) {
    if (input.machineModel) machineHeader.push(`Model: ${input.machineModel}`);
    if (input.serialNumber) machineHeader.push(`Serial: ${input.serialNumber}`);
    if (input.machineHours) machineHeader.push(`Hours: ${input.machineHours}`);
    if (input.warrantyPlan) machineHeader.push(`Plan: ${input.warrantyPlan}`);
    if (input.saleDate) machineHeader.push(`Sale date: ${input.saleDate}`);
    if (input.repairDate) machineHeader.push(`Repair date: ${input.repairDate}`);
  }

  const lines = [
    coverageBanner(result.coverageLabel),
    ...(machineHeader.length > 0 ? ["", machineHeader.join(" | ")] : []),
    "",
    `Key part number: ${result.keyPartNumber}`,
    `Cause: ${result.cause}`,
    "Diagnose:",
    ...formatSteps(result.diagnose),
    "Repair:",
    ...formatSteps(result.repair),
    "Clean up:",
    ...formatSteps(result.cleanUp),
  ];
  if (result.verification) {
    lines.push("Verification:", result.verification);
  }
  return lines.join("\n");
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
