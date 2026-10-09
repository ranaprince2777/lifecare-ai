# LifeCare AI — Supabase Database Setup Guide

Follow this simple 5-step guide to connect your Supabase project (Mumbai region: `ap-south-1`) to LifeCare AI safely.

---

## Step 1: Open the Supabase SQL Editor
1. Log in to [supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your LifeCare AI project.
3. In the left-hand navigation sidebar, click the **SQL Editor** icon (`>_`).
4. Click **New query** (or the **+** button).

---

## Step 2: Paste and Execute the Migration Schema
1. Open [`supabase/schema.sql`](supabase/schema.sql) in your project workspace.
2. Copy the entire contents of the file.
3. Paste it into the SQL Editor query window.
4. Click the green **Run** button (or press `Ctrl + Enter` / `Cmd + Enter`).
5. Verify the console says: **"Success. No rows returned"**.

> **Safety Notice:** This script is non-destructive (`IF NOT EXISTS` and `DROP POLICY IF EXISTS`). Running it will never drop tables, truncate records, or destroy data.

---

## Step 3: Run the Schema Verification Query
1. Open a new query tab in the SQL Editor.
2. Copy and paste the queries from [`supabase/verify_schema.sql`](supabase/verify_schema.sql).
3. Click **Run**.
4. Check the results:
   - **Query 1 (Tables & RLS):** 6 tables (`profiles`, `medical_documents`, `extracted_observations`, `medications`, `diagnoses`, `document_summaries`), all with `rls_enabled: true`.
   - **Query 2 (Indexes):** 8 performance indexes listed.
   - **Query 3 (RLS Policies):** 15 policies, all restricted to `{authenticated}`.
   - **Query 4 (Foreign Keys):** 5 cascading foreign keys linked to `medical_documents(id)`.
   - **Query 5 (Storage Bucket):** `medical_documents` bucket exists with `public: false`.
   - **Query 6 (Storage Policies):** 2 storage policies on `storage.objects`.

---

## Step 4: Find Your API Keys in Supabase
1. In the left-hand navigation sidebar, click the **Project Settings** (gear icon ⚙️) at the bottom.
2. Under the **Configuration** menu, click **API**.
3. Under **Project URL**, copy the URL (e.g. `https://xyzcompany.supabase.co`).
4. Under **Project API keys**:
   - Find `anon` / `public` (Publishable Key): Copy the string.
   - Find `service_role` (Secret Key): Click **Reveal** and copy the string.

---

## Step 5: Configure `.env.local` Securely
Open your local `.env.local` file in the project root (never committed to git) and add:

```ini
# =======================================================
# LifeCare AI — Supabase Cloud Database Configuration
# =======================================================
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...[YOUR_ANON_KEY]
SUPABASE_SECRET_KEY=eyJhbGciOi...[YOUR_SERVICE_ROLE_KEY]
SUPABASE_STORAGE_BUCKET=medical_documents

# Storage Mode (auto = use Supabase when configured, fallback to local JSON if not)
MEDIMIND_STORAGE_MODE=auto
```

> **Security Rule:** Never prefix `SUPABASE_SECRET_KEY` with `NEXT_PUBLIC_`. Keep it strictly in `.env.local`. It is only used by server-side Next.js route handlers to bypass RLS for administrative background processing and data hydration.
