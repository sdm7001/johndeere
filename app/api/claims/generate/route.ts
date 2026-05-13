import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { refineCdrWithAnthropic } from "@/lib/anthropic-cdr";
import { checkCoverageEligibility, claimInputSchema, generateCdr } from "@/lib/cdr";
import { saveClaimRecord } from "@/lib/claim-records";
import { appConfig } from "@/lib/config";
import { buildSourceNotes } from "@/lib/warranty-rules";

export async function POST(request: Request) {
  let createdBy: string | null = null;

  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    createdBy = userId;
  }

  const json = await request.json().catch(() => null);
  const parsed = claimInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid claim input.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const denial = checkCoverageEligibility(parsed.data);
  if (denial) {
    return NextResponse.json({ denial });
  }

  let result = generateCdr(parsed.data);
  result = await refineCdrWithAnthropic(parsed.data, result);
  result.sourceNotes = [...result.sourceNotes, ...(await buildSourceNotes(parsed.data, result))];
  const record = await saveClaimRecord(parsed.data, result, createdBy);

  return NextResponse.json({ result, record });
}
