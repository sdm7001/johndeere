import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CdrResult, ClaimInput } from "@/lib/cdr";

export type ClaimRecord = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  input: ClaimInput;
  result: CdrResult;
};

export type ClaimRecordSummary = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  customerComplaintPreview: string;
  workorderTime: string;
  claimableTime: number;
  warningsCount: number;
  keyPartNumber: string;
};

const recordsDirectory = process.env.CLAIM_RECORDS_DIR ?? "data/claim-records";

export async function saveClaimRecord(input: ClaimInput, result: CdrResult, createdBy: string | null) {
  await mkdir(recordsDirectory, { recursive: true });

  const createdAt = new Date().toISOString();
  const record: ClaimRecord = {
    id: createRecordId(createdAt),
    createdAt,
    createdBy,
    input,
    result,
  };

  await writeFile(getRecordPath(record.id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export async function listClaimRecords(limit = 25): Promise<ClaimRecordSummary[]> {
  await mkdir(recordsDirectory, { recursive: true });

  const filenames = await readdir(recordsDirectory);
  const recordFilenames = filenames.filter((filename) => filename.endsWith(".json")).sort().reverse();
  const records = await Promise.all(recordFilenames.slice(0, limit).map(readRecordSummary));

  return records.filter((record): record is ClaimRecordSummary => Boolean(record));
}

function getRecordPath(id: string) {
  return path.join(recordsDirectory, `${id}.json`);
}

function createRecordId(createdAt: string) {
  const timestamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = randomUUID().slice(0, 8);
  return `claim-${timestamp}-${random}`;
}

async function readRecordSummary(filename: string): Promise<ClaimRecordSummary | null> {
  try {
    const raw = await readFile(path.join(recordsDirectory, filename), "utf8");
    const record = JSON.parse(raw) as ClaimRecord;

    return {
      id: record.id,
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      customerComplaintPreview: preview(record.input.customerComplaint),
      workorderTime: record.input.workorderTime,
      claimableTime: record.result.claimableTime,
      warningsCount: record.result.warnings.length,
      keyPartNumber: record.result.keyPartNumber,
    };
  } catch {
    return null;
  }
}

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}
