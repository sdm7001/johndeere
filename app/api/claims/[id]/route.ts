import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getClaimRecord } from "@/lib/claim-records";
import { appConfig } from "@/lib/config";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const record = await getClaimRecord(id);

  if (!record) {
    return NextResponse.json({ error: "Claim record not found." }, { status: 404 });
  }

  return NextResponse.json({ record });
}
