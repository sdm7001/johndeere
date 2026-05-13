import { readFile } from "node:fs/promises";
import path from "node:path";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { appConfig } from "@/lib/config";

const vaultRoot = path.resolve(process.env.WARRANTY_VAULT_DIR ?? "vault");

export async function GET(request: Request) {
  if (appConfig.clerkIsConfigured) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path parameter required." }, { status: 400 });
  }

  // Security: resolve and confirm the file is inside the vault root
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(vaultRoot)) {
    return NextResponse.json({ error: "Path outside vault." }, { status: 403 });
  }

  if (!resolved.endsWith(".md")) {
    return NextResponse.json({ error: "Only .md files are accessible." }, { status: 403 });
  }

  try {
    const content = await readFile(resolved, "utf8");
    return NextResponse.json({ content, path: filePath });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
