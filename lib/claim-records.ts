import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CdrResult, ClaimInput } from "@/lib/cdr";
import { ensureSchema, getPool } from "@/lib/postgres";

export const claimStatuses = ["draft", "needs_clarification", "approved", "copied"] as const;

export type ClaimStatus = (typeof claimStatuses)[number];

export type ClaimRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  status: ClaimStatus;
  input: ClaimInput;
  result: CdrResult;
};

export type ClaimRecordSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  status: ClaimStatus;
  customerComplaintPreview: string;
  workorderTime: string;
  claimableTime: number;
  warningsCount: number;
  keyPartNumber: string;
};

const recordsDirectory = process.env.CLAIM_RECORDS_DIR ?? "data/claim-records";

export async function saveClaimRecord(input: ClaimInput, result: CdrResult, createdBy: string | null) {
  const createdAt = new Date().toISOString();
  const record: ClaimRecord = {
    id: createRecordId(createdAt),
    createdAt,
    updatedAt: createdAt,
    createdBy,
    status: "draft",
    input,
    result,
  };

  if (await savePostgresRecord(record)) {
    return record;
  }

  await mkdir(recordsDirectory, { recursive: true });
  await writeFile(getRecordPath(record.id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return record;
}

export type ClaimRecordFilters = {
  status?: ClaimStatus;
  hasWarnings?: boolean;
  limit?: number;
};

export async function listClaimRecords(filters: ClaimRecordFilters = {}): Promise<ClaimRecordSummary[]> {
  const { limit = 25 } = filters;
  const postgresRecords = await listPostgresRecords(filters);
  if (postgresRecords) {
    return postgresRecords;
  }

  await mkdir(recordsDirectory, { recursive: true });

  const filenames = await readdir(recordsDirectory);
  const recordFilenames = filenames.filter((filename) => filename.endsWith(".json")).sort().reverse();
  let records = (await Promise.all(recordFilenames.slice(0, 200).map(readRecordSummary))).filter(
    (record): record is ClaimRecordSummary => Boolean(record),
  );

  if (filters.status) {
    records = records.filter((r) => r.status === filters.status);
  }
  if (filters.hasWarnings !== undefined) {
    records = records.filter((r) => (r.warningsCount > 0) === filters.hasWarnings);
  }

  return records.slice(0, limit);
}

export async function getClaimRecord(id: string): Promise<ClaimRecord | null> {
  // Validate id format to prevent path traversal
  if (!/^[\w-]+$/.test(id)) {
    return null;
  }

  const postgresRecord = await getPostgresRecord(id);
  if (postgresRecord !== undefined) {
    return postgresRecord;
  }

  try {
    const raw = await readFile(getRecordPath(id), "utf8");
    return JSON.parse(raw) as ClaimRecord;
  } catch {
    return null;
  }
}

export type DashboardMetrics = {
  totalClaims: number;
  draftCount: number;
  needsClarificationCount: number;
  approvedCount: number;
  copiedCount: number;
  totalClaimableHours: number;
  missingKeyPartCount: number;
  claimsWithWarningsCount: number;
  laborVarianceCount: number;
};

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  if (!(await ensureSchema())) {
    return null;
  }

  const db = getPool();
  if (!db) {
    return null;
  }

  const { rows } = await db.query(`
    select
      count(*)                                                                             as total_claims,
      count(*) filter (where status = 'draft')                                            as draft_count,
      count(*) filter (where status = 'needs_clarification')                              as needs_clarification_count,
      count(*) filter (where status = 'approved')                                         as approved_count,
      count(*) filter (where status = 'copied')                                           as copied_count,
      coalesce(sum(claimable_time), 0)                                                    as total_claimable_hours,
      count(*) filter (where key_part_number = '')                                        as missing_key_part_count,
      count(*) filter (where warnings_count > 0)                                          as claims_with_warnings_count,
      count(*) filter (
        where workorder_time ~ '^[0-9]+(\\.[0-9]+)?$'
          and abs(cast(workorder_time as numeric) - claimable_time) > 0.05
      )                                                                                    as labor_variance_count
    from claim_records
  `);

  const row = rows[0];
  if (!row) return null;

  return {
    totalClaims: Number(row.total_claims),
    draftCount: Number(row.draft_count),
    needsClarificationCount: Number(row.needs_clarification_count),
    approvedCount: Number(row.approved_count),
    copiedCount: Number(row.copied_count),
    totalClaimableHours: Number(row.total_claimable_hours),
    missingKeyPartCount: Number(row.missing_key_part_count),
    claimsWithWarningsCount: Number(row.claims_with_warnings_count),
    laborVarianceCount: Number(row.labor_variance_count),
  };
}

export async function updateClaimStatus(id: string, status: ClaimStatus) {
  if (!claimStatuses.includes(status)) {
    throw new Error("Invalid claim status.");
  }

  const postgresRecord = await updatePostgresStatus(id, status);
  if (postgresRecord) {
    return postgresRecord;
  }

  const raw = await readFile(getRecordPath(id), "utf8");
  const record = JSON.parse(raw) as ClaimRecord;
  record.status = status;
  record.updatedAt = new Date().toISOString();
  await writeFile(getRecordPath(id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return summarizeRecord(record);
}

export async function deleteClaimRecord(id: string): Promise<boolean> {
  const deletedInDb = await deletePostgresRecord(id);
  if (deletedInDb !== null) {
    return deletedInDb;
  }

  // JSON file fallback
  const filePath = getRecordPath(id);
  try {
    const { unlink } = await import("fs/promises");
    await unlink(filePath);
    return true;
  } catch {
    return false;
  }
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
      ...summarizeRecord(record),
    };
  } catch {
    return null;
  }
}

async function savePostgresRecord(record: ClaimRecord) {
  if (!(await ensureSchema())) {
    return false;
  }

  const db = getPool();
  if (!db) {
    return false;
  }

  await db.query(
    `
    insert into claim_records (
      id, created_at, updated_at, created_by, status,
      customer_complaint, technician_writeup, workorder_time,
      machine_model, serial_number, machine_hours, sale_date, warranty_plan, repair_date,
      key_part_number, claimable_time, warnings_count, input, result
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `,
    [
      record.id,
      record.createdAt,
      record.updatedAt,
      record.createdBy,
      record.status,
      record.input.customerComplaint,
      record.input.technicianWriteup,
      record.input.workorderTime,
      record.input.machineModel ?? null,
      record.input.serialNumber ?? null,
      record.input.machineHours ?? null,
      record.input.saleDate ?? null,
      record.input.warrantyPlan ?? null,
      record.input.repairDate ?? null,
      record.result.keyPartNumber,
      record.result.claimableTime,
      record.result.warnings.length,
      record.input,
      record.result,
    ],
  );

  return true;
}

async function getPostgresRecord(id: string): Promise<ClaimRecord | null | undefined> {
  if (!(await ensureSchema())) {
    return undefined;
  }

  const db = getPool();
  if (!db) {
    return undefined;
  }

  const { rows } = await db.query(
    `select id, created_at, updated_at, created_by, status, input, result from claim_records where id = $1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    createdBy: row.created_by,
    status: row.status,
    input: row.input as ClaimRecord["input"],
    result: row.result as ClaimRecord["result"],
  };
}

async function listPostgresRecords(filters: ClaimRecordFilters) {
  if (!(await ensureSchema())) {
    return null;
  }

  const db = getPool();
  if (!db) {
    return null;
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.hasWarnings !== undefined) {
    conditions.push(filters.hasWarnings ? "warnings_count > 0" : "warnings_count = 0");
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  values.push(filters.limit ?? 25);
  const limitParam = `$${values.length}`;

  const { rows } = await db.query(
    `
    select
      id,
      created_at,
      updated_at,
      created_by,
      status,
      customer_complaint,
      workorder_time,
      key_part_number,
      claimable_time,
      warnings_count
    from claim_records
    ${where}
    order by created_at desc
    limit ${limitParam}
    `,
    values,
  );

  return rows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    createdBy: row.created_by,
    status: row.status,
    customerComplaintPreview: preview(row.customer_complaint),
    workorderTime: row.workorder_time,
    claimableTime: Number(row.claimable_time),
    warningsCount: Number(row.warnings_count),
    keyPartNumber: row.key_part_number,
  })) satisfies ClaimRecordSummary[];
}

async function updatePostgresStatus(id: string, status: ClaimStatus) {
  if (!(await ensureSchema())) {
    return null;
  }

  const db = getPool();
  if (!db) {
    return null;
  }

  const { rows } = await db.query(
    `
    update claim_records
    set status = $2, updated_at = now()
    where id = $1
    returning
      id,
      created_at,
      updated_at,
      created_by,
      status,
      customer_complaint,
      workorder_time,
      key_part_number,
      claimable_time,
      warnings_count
    `,
    [id, status],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    createdBy: row.created_by,
    status: row.status,
    customerComplaintPreview: preview(row.customer_complaint),
    workorderTime: row.workorder_time,
    claimableTime: Number(row.claimable_time),
    warningsCount: Number(row.warnings_count),
    keyPartNumber: row.key_part_number,
  } satisfies ClaimRecordSummary;
}

async function deletePostgresRecord(id: string): Promise<boolean | null> {
  if (!(await ensureSchema())) {
    return null;
  }

  const db = getPool();
  if (!db) {
    return null;
  }

  const { rowCount } = await db.query(`delete from claim_records where id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

function summarizeRecord(record: ClaimRecord): ClaimRecordSummary {
  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? record.createdAt,
    createdBy: record.createdBy,
    status: record.status ?? "draft",
    customerComplaintPreview: preview(record.input.customerComplaint),
    workorderTime: record.input.workorderTime,
    claimableTime: record.result.claimableTime,
    warningsCount: record.result.warnings.length,
    keyPartNumber: record.result.keyPartNumber,
  };
}

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}
