import { randomUUID } from "node:crypto";

import { ensureSchema, getPool } from "@/lib/postgres";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MstEntry = {
  id: string;
  jobCode: string;
  description: string;
  productFamily: string;
  modelRange: string;
  allowedHours: number;
  sourceReference: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
};

export type OperationCode = {
  id: string;
  code: string;
  description: string;
  productFamily: string;
  modelRange: string;
  sourceReference: string;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// MST entries
// ---------------------------------------------------------------------------

export async function listMstEntries(): Promise<MstEntry[]> {
  if (!(await ensureSchema())) return [];
  const db = getPool();
  if (!db) return [];

  const { rows } = await db.query(
    `select id, job_code, description, product_family, model_range, allowed_hours,
            source_reference, effective_date, created_at, updated_at
     from mst_entries order by product_family, description`,
  );

  return rows.map(rowToMst);
}

export async function createMstEntry(
  data: Omit<MstEntry, "id" | "createdAt" | "updatedAt">,
): Promise<MstEntry> {
  if (!(await ensureSchema())) throw new Error("Database unavailable.");
  const db = getPool();
  if (!db) throw new Error("Database unavailable.");

  const id = `mst-${randomUUID().slice(0, 8)}`;
  const { rows } = await db.query(
    `insert into mst_entries
       (id, job_code, description, product_family, model_range, allowed_hours,
        source_reference, effective_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning id, job_code, description, product_family, model_range, allowed_hours,
               source_reference, effective_date, created_at, updated_at`,
    [
      id,
      data.jobCode,
      data.description,
      data.productFamily,
      data.modelRange,
      data.allowedHours,
      data.sourceReference,
      data.effectiveDate,
    ],
  );
  return rowToMst(rows[0]);
}

export async function deleteMstEntry(id: string): Promise<boolean> {
  if (!(await ensureSchema())) return false;
  const db = getPool();
  if (!db) return false;

  const { rowCount } = await db.query(`delete from mst_entries where id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

function rowToMst(row: Record<string, unknown>): MstEntry {
  return {
    id: row.id as string,
    jobCode: row.job_code as string,
    description: row.description as string,
    productFamily: row.product_family as string,
    modelRange: row.model_range as string,
    allowedHours: Number(row.allowed_hours),
    sourceReference: row.source_reference as string,
    effectiveDate: row.effective_date as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Operation codes
// ---------------------------------------------------------------------------

export async function listOperationCodes(): Promise<OperationCode[]> {
  if (!(await ensureSchema())) return [];
  const db = getPool();
  if (!db) return [];

  const { rows } = await db.query(
    `select id, code, description, product_family, model_range,
            source_reference, effective_date, created_at, updated_at
     from operation_codes order by code`,
  );

  return rows.map(rowToOpCode);
}

export async function createOperationCode(
  data: Omit<OperationCode, "id" | "createdAt" | "updatedAt">,
): Promise<OperationCode> {
  if (!(await ensureSchema())) throw new Error("Database unavailable.");
  const db = getPool();
  if (!db) throw new Error("Database unavailable.");

  const id = `opc-${randomUUID().slice(0, 8)}`;
  const { rows } = await db.query(
    `insert into operation_codes
       (id, code, description, product_family, model_range, source_reference, effective_date)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning id, code, description, product_family, model_range,
               source_reference, effective_date, created_at, updated_at`,
    [
      id,
      data.code,
      data.description,
      data.productFamily,
      data.modelRange,
      data.sourceReference,
      data.effectiveDate,
    ],
  );
  return rowToOpCode(rows[0]);
}

export async function deleteOperationCode(id: string): Promise<boolean> {
  if (!(await ensureSchema())) return false;
  const db = getPool();
  if (!db) return false;

  const { rowCount } = await db.query(`delete from operation_codes where id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

function rowToOpCode(row: Record<string, unknown>): OperationCode {
  return {
    id: row.id as string,
    code: row.code as string,
    description: row.description as string,
    productFamily: row.product_family as string,
    modelRange: row.model_range as string,
    sourceReference: row.source_reference as string,
    effectiveDate: row.effective_date as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}
