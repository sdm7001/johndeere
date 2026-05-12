import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { listClaimRecords } from "@/lib/claim-records";
import { appConfig } from "@/lib/config";

export async function GET() {
  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const records = await listClaimRecords(25);
  return NextResponse.json({ records });
}
