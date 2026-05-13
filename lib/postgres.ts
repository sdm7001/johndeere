import { Pool } from "pg";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  return pool;
}

export async function ensureSchema() {
  const db = getPool();
  if (!db) {
    return false;
  }

  schemaReady ??= db
    .query(
      `
      create table if not exists claim_records (
        id text primary key,
        created_at timestamptz not null,
        updated_at timestamptz not null,
        created_by text,
        status text not null default 'draft'
          check (status in ('draft', 'needs_clarification', 'approved', 'copied')),
        customer_complaint text not null,
        technician_writeup text not null,
        workorder_time text not null,
        machine_model text,
        serial_number text,
        machine_hours text,
        sale_date text,
        warranty_plan text,
        repair_date text,
        key_part_number text not null default '',
        claimable_time numeric not null default 0,
        warnings_count integer not null default 0,
        input jsonb not null,
        result jsonb not null
      );

      create index if not exists claim_records_created_at_idx
        on claim_records (created_at desc);

      create index if not exists claim_records_status_idx
        on claim_records (status);

      -- Add machine detail columns if they don't exist yet (idempotent migration)
      alter table claim_records add column if not exists machine_model text;
      alter table claim_records add column if not exists serial_number text;
      alter table claim_records add column if not exists machine_hours text;
      alter table claim_records add column if not exists sale_date text;
      alter table claim_records add column if not exists warranty_plan text;
      alter table claim_records add column if not exists repair_date text;

      create table if not exists mst_entries (
        id text primary key,
        job_code text not null default '',
        description text not null,
        product_family text not null default '',
        model_range text not null default '',
        allowed_hours numeric not null,
        source_reference text not null default '',
        effective_date text not null default '',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists operation_codes (
        id text primary key,
        code text not null,
        description text not null,
        product_family text not null default '',
        model_range text not null default '',
        source_reference text not null default '',
        effective_date text not null default '',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create table if not exists warranty_sources (
        id text primary key,
        source_type text not null,
        title text not null,
        status text not null default 'registered',
        path text,
        section text,
        authority text,
        notes text,
        metadata jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      );
      `,
    )
    .then(() => undefined);

  await schemaReady;
  return true;
}
