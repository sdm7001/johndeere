import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { CdrResult, ClaimInput } from "@/lib/cdr";
import { ensureSchema, getPool } from "@/lib/postgres";

export type WarrantySourceNote = {
  id: string;
  title: string;
  path: string;
  sourceType: string;
  section: string;
  authority: string;
  status: string;
  body: string;
};

const vaultDirectory = process.env.WARRANTY_VAULT_DIR ?? "vault";

export async function getRelevantWarrantySourceNotes(input: ClaimInput, result: CdrResult) {
  const notes = await indexWarrantySourceNotes();
  await syncSourcesToPostgres(notes);

  const haystack = `${input.customerComplaint}\n${input.technicianWriteup}\n${result.copyText}`.toLowerCase();
  const selected = new Map<string, WarrantySourceNote>();

  addByTitle(notes, selected, "CDR Format Rules");

  if (matchesAny(haystack, ["diagnos", "service advisor", "calibrat", "fault code", "continuity", "pressure"])) {
    addByTitle(notes, selected, "WAM 110.14 - Diagnostic Labor");
  }

  if (matchesAny(haystack, ["clean", "wash", "oil", "hydraulic", "coolant", "fuel", "fluid", "leak"])) {
    addByTitle(notes, selected, "WAM 110.16 - Clean Up Labor");
  }

  addByTitle(notes, selected, "MST Flat-Rate Source Register");
  addByTitle(notes, selected, "Warranty Operation Code Source Register");

  return Array.from(selected.values());
}

export async function buildSourceNotes(input: ClaimInput, result: CdrResult) {
  const notes = await getRelevantWarrantySourceNotes(input, result);

  return notes.map((note) => {
    const section = note.section ? ` ${note.section}` : "";
    const status = note.status === "pending" ? "pending official source" : note.authority || "registered";
    return `Obsidian source: ${note.title}${section} (${status}) - ${note.path}`;
  });
}

async function indexWarrantySourceNotes() {
  const markdownFiles = await listMarkdownFiles(vaultDirectory);
  const notes = await Promise.all(markdownFiles.map(readWarrantySourceNote));

  return notes.filter((note): note is WarrantySourceNote => Boolean(note));
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
    }),
  );

  return files.flat();
}

async function readWarrantySourceNote(filePath: string): Promise<WarrantySourceNote | null> {
  const raw = await readFile(filePath, "utf8");
  const frontmatter = parseFrontmatter(raw);
  const type = frontmatter.type ?? "";

  if (!["warranty_rule", "warranty_source"].includes(type)) {
    return null;
  }

  const title = frontmatter.title ?? extractTitle(raw) ?? path.basename(filePath, ".md");

  return {
    id: slugify(`${frontmatter.source_type ?? type}-${frontmatter.section ?? title}`),
    title,
    path: filePath,
    sourceType: frontmatter.source_type ?? type,
    section: frontmatter.section ?? "",
    authority: frontmatter.authority ?? "",
    status: frontmatter.status ?? "registered",
    body: raw.replace(/^---[\s\S]*?---/, "").trim(),
  };
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const result: Record<string, string> = {};

  if (!match) {
    return result;
  }

  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || !rest.length || line.startsWith(" ")) {
      continue;
    }
    result[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
  }

  return result;
}

function extractTitle(raw: string) {
  return raw.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function matchesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function addByTitle(notes: WarrantySourceNote[], selected: Map<string, WarrantySourceNote>, title: string) {
  const note = notes.find((candidate) => candidate.title === title);
  if (note) {
    selected.set(note.id, note);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function syncSourcesToPostgres(notes: WarrantySourceNote[]) {
  if (!(await ensureSchema())) {
    return;
  }

  const db = getPool();
  if (!db) {
    return;
  }

  for (const note of notes) {
    await db.query(
      `
      insert into warranty_sources (
        id, source_type, title, status, path, section, authority, notes, metadata, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      on conflict (id) do update set
        source_type = excluded.source_type,
        title = excluded.title,
        status = excluded.status,
        path = excluded.path,
        section = excluded.section,
        authority = excluded.authority,
        notes = excluded.notes,
        metadata = excluded.metadata,
        updated_at = now()
      `,
      [
        note.id,
        note.sourceType,
        note.title,
        note.status,
        note.path,
        note.section,
        note.authority,
        note.body.slice(0, 4000),
        { indexedFrom: "obsidian-vault" },
      ],
    );
  }
}
