-- ====================================================================
-- LifeCare AI — Verification Queries for Supabase Database
-- Run this in Supabase SQL Editor after executing the migration.
-- ====================================================================

-- 1. Verify that all 6 tables exist and have RLS enabled (Should return 6 rows, all true)
select 
  tablename, 
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 
    'medical_documents', 
    'extracted_observations', 
    'medications', 
    'diagnoses', 
    'document_summaries'
  )
order by tablename;

-- 2. Verify Performance Indexes (Should return 8 indexes)
select 
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_documents_user',
    'idx_documents_date',
    'idx_documents_hash',
    'idx_observations_doc',
    'idx_observations_flag',
    'idx_medications_doc',
    'idx_diagnoses_doc',
    'idx_summaries_doc'
  )
order by tablename, indexname;

-- 3. Verify Active RLS Policies (Should return 15 policies, all restricted to authenticated)
select 
  tablename, 
  policyname, 
  roles, 
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 
    'medical_documents', 
    'extracted_observations', 
    'medications', 
    'diagnoses', 
    'document_summaries'
  )
order by tablename, policyname;

-- 4. Verify Foreign Key Cascade Constraints (Should return 5 cascading foreign keys)
select
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name as foreign_table_name,
  rc.delete_rule
from information_schema.table_constraints as tc 
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.referential_constraints as rc
  on tc.constraint_name = rc.constraint_name
join information_schema.constraint_column_usage as ccu
  on rc.unique_constraint_name = ccu.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
  and tc.table_schema = 'public'
  and tc.table_name in (
    'medical_documents',
    'extracted_observations',
    'medications',
    'diagnoses',
    'document_summaries'
  )
order by tc.table_name;

-- 5. Verify Private Storage Bucket Configuration (Should return 1 row, public = false)
select 
  id, 
  name, 
  public, 
  created_at
from storage.buckets
where id = 'medical_documents';

-- 6. Verify Storage Policies on storage.objects (Should return 2 policies)
select 
  policyname, 
  roles, 
  cmd
from pg_policies
where schemaname = 'storage' 
  and tablename = 'objects'
  and policyname in (
    'Authenticated users can read own document files',
    'Authenticated users can upload own document files'
  );
