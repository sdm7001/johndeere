import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { claimStatuses, listClaimRecords, updateClaimStatus } from "@/lib/claim-records";
import { appConfig } from "@/lib/config";

const statusUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(claimStatuses),
});

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

export async function PATCH(request: Request) {
  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const json = await request.json().catch(() => null);
  const parsed = statusUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid status update.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const record = await updateClaimStatus(parsed.data.id, parsed.data.status);
  if (!record) {
    return NextResponse.json({ error: "Claim record not found." }, { status: 404 });
  }

  return NextResponse.json({ record });
}
