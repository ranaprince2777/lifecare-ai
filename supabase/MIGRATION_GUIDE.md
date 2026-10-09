# LifeCare AI — Database Migration & Safe Cutover Guide

This guide establishes the version-controlled migration lifecycle, rollback protocols, pre-checks, and cutover strategy for LifeCare AI on Supabase PostgreSQL.

---

## 1. Migration Structure & Version Control

All database schema evolutions must be strictly version-controlled under `supabase/migrations/` using timestamped prefixes:

```
supabase/
├── schema.sql                               # Consolidated current canonical schema
├── verify_schema.sql                        # Post-migration validation suite
├── MIGRATION_GUIDE.md                       # This governance guide
└── migrations/
    └── 20261009000000_initial_schema.sql    # Migration 001: Core tables, RLS, storage
```

### Invariant Rules
1. **Additive Only:** Schema modifications must prefer additive changes:
   - Use `CREATE TABLE IF NOT EXISTS`.
   - Add new columns as `NULLABLE` or with default values.
   - Add indexes with `CREATE INDEX IF NOT EXISTS`.
2. **Never Destructive:** NEVER use `DROP TABLE`, `TRUNCATE`, or bulk `DELETE` in standard migrations.
3. **Idempotent Policies:** Use `DROP POLICY IF EXISTS <name> ON <table>; CREATE POLICY <name> ON <table>...` to prevent duplicate-policy errors on rerun.
4. **Canonical Sync:** Any change added to `migrations/` must be synchronized in `supabase/schema.sql`.

---

## 2. Pre-Migration Checklist & Backup Procedures

Before applying any migration to the remote Supabase project:

1. **Verify Target Environment:** Confirm the project reference corresponds to your Mumbai (`ap-south-1`) instance.
2. **Pre-Check Object Existence:** Run the inspection queries to verify which tables, extensions, and types exist.
3. **Export Existing Data (Backup Procedure):**
   - In Supabase Dashboard: Navigate to **Database** -> **Backups** to verify automated daily backups.
   - For point-in-time tables export: Run:
     ```sql
     -- Export summary metrics
     select count(*) from public.medical_documents;
     select count(*) from public.extracted_observations;
     ```
   - For local mode: Ensure `data/records.json` and `data/patient.json` are backed up before running live sync scripts.

---

## 3. Safe Execution Protocol

1. **Open Supabase SQL Editor:** Navigate to SQL Editor on `supabase.com/dashboard`.
2. **Paste Migration Script:** Load the desired migration file (e.g. `supabase/migrations/20261009000000_initial_schema.sql`).
3. **Execute:** Run the query and observe the output message.
4. **Run Verification:** Immediately execute `supabase/verify_schema.sql` to validate that all 6 tables have RLS enabled, all 8 indexes are present, and the private storage bucket is active.

---

## 4. Rollback & Recovery Protocols

Because health data is sensitive and subject to regulatory controls, destructive rollbacks (such as dropping tables) are avoided in favor of **forward-fix migrations**.

### Rollback Strategy by Operation

| Change Type | Rollback Action | Risk Level |
| :--- | :--- | :--- |
| **New Column Added** | Leave column intact or mark deprecated; do NOT drop column if populated. | Low |
| **Index Added** | `DROP INDEX IF EXISTS idx_name;` | Very Low |
| **RLS Policy Changed** | Re-apply previous policy definition using `DROP POLICY IF EXISTS ...; CREATE POLICY ...;` | Medium |
| **Table Added in Error** | Remove references in code first; drop empty table only after verifying zero records. | High |

### Emergency Recovery
If an unrecoverable schema error occurs during manual execution:
1. Retain local mode (`MEDIMIND_STORAGE_MODE=local` in `.env.local`). The application will seamlessly serve records from `data/records.json` without cloud dependency.
2. Supabase Point-in-Time Recovery (PITR) is accessible from Dashboard -> Database -> Backups.

---

## 5. Local-to-Cloud Cutover Strategy

LifeCare AI utilizes a **Hybrid Dual-Persistence Engine**:

```
                         ┌────────────────────────────────────┐
                         │   MEDIMIND_STORAGE_MODE            │
                         └───────────────┬────────────────────┘
                                         │
               ┌─────────────────────────┼─────────────────────────┐
               ▼                         ▼                         ▼
          "local"                     "auto"                  "supabase"
     (Strict Local JSON)        (Detects credentials      (Strict Cloud Mode)
     data/records.json           & falls back safely)      Supabase Mumbai
```

1. **Default Safety (`auto`):** If Supabase credentials are missing or invalid, the adapter automatically routes all operations to `data/records.json`.
2. **Non-Destructive Cloud Seeding:** When connecting to Supabase for the first time, existing local demo records can be synchronized to the cloud without deleting or overwriting any existing data.
3. **Failure Isolation:** If a network timeout or cloud failure occurs during upload, the adapter saves the record locally and logs a non-fatal warning, ensuring 0% document loss.
