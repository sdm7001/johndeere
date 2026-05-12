import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { claimInputSchema, generateCdr } from "@/lib/cdr";
import { appConfig } from "@/lib/config";

export async function POST(request: Request) {
  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

  return NextResponse.json({ result: generateCdr(parsed.data) });
}
