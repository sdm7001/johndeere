import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { appConfig } from "@/lib/config";
import { createMstEntry, deleteMstEntry, listMstEntries } from "@/lib/warranty-data";

const createSchema = z.object({
  jobCode: z.string().trim().default(""),
  description: z.string().trim().min(1, "Description is required."),
  productFamily: z.string().trim().default(""),
  modelRange: z.string().trim().default(""),
  allowedHours: z.number().positive("Allowed hours must be a positive number."),
  sourceReference: z.string().trim().default(""),
  effectiveDate: z.string().trim().default(""),
});

async function requireAuth() {
  if (!appConfig.clerkIsConfigured) return true;
  const { userId } = await auth();
  return Boolean(userId);
}

export async function GET() {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const entries = await listMstEntries();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const entry = await createMstEntry(parsed.data);
  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const deleted = await deleteMstEntry(id);
  if (!deleted) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  return NextResponse.json({ deleted: true });
}
