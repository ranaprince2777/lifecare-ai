-- ====================================================================
-- MediMind AI — Supabase PostgreSQL Database Schema
-- Compatible with PostgreSQL 15+ and Supabase Auth & Storage
-- ====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. User Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  age integer,
  gender text check (gender in ('Male', 'Female', 'Other', 'Prefer not to say')),
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  mock_abha_id text, -- Formatted like XX-XXXX-XXXX-XXXX for demo
  allergies text[] default '{}',
  chronic_conditions text[] default '{}',
  emergency_contact jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Medical Documents
create table if not exists public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  file_size integer not null,
  mime_type text not null,
  file_path text not null, -- Supabase storage path or local object key
  file_hash text not null, -- SHA-256 hash for duplicate detection
  document_type text check (document_type in ('Lab Report', 'Prescription', 'Diagnostic Report', 'Discharge Summary', 'Other')) default 'Other',
  document_date date,
  provider_name text,
  patient_name_extracted text,
  patient_age_extracted integer,
  raw_extracted_text text,
  extraction_method text check (extraction_method in ('pdf_embedded', 'ocr_tesseract', 'pymupdf', 'manual_fallback', 'demo_fixture')),
  processing_status text check (processing_status in ('pending', 'extracting_text', 'structuring_ai', 'completed', 'failed')) default 'pending',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Extracted Observations (Lab Tests & Diagnostics)
create table if not exists public.extracted_observations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  test_name text not null,
  category text default 'General',
  test_result_value text not null,
  test_result_numeric numeric,
  unit text,
  reference_range_raw text,
  reference_range_low numeric,
  reference_range_high numeric,
  flag text check (flag in ('NORMAL', 'HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'UNCLASSIFIED')) default 'UNCLASSIFIED',
  flag_source text check (flag_source in ('source_reported', 'calculated', 'unspecified')) default 'unspecified',
  confidence numeric check (confidence >= 0 and confidence <= 1) default 1.0,
  requires_review boolean default false,
  source_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Extracted Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  medication_name text not null,
  dosage text,
  frequency text,
  duration text,
  route text default 'Oral',
  instructions text,
  is_active boolean default true,
  prescribed_date date,
  prescribing_doctor text,
  confidence numeric check (confidence >= 0 and confidence <= 1) default 1.0,
  source_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Extracted Diagnoses & Findings
create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  condition_name text not null,
  icd10_code text,
  status text check (status in ('Active', 'Resolved', 'Suspected', 'Chronic', 'Unknown')) default 'Active',
  provider_notes text,
  source_text text,
  confidence numeric check (confidence >= 0 and confidence <= 1) default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Document Summaries & Plain-Language Explanations
create table if not exists public.document_summaries (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.medical_documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  summary_en text not null,
  summary_hi text,
  key_findings jsonb default '[]'::jsonb,
  abnormal_highlights jsonb default '[]'::jsonb,
  doctor_questions jsonb default '[]'::jsonb,
  model_used text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_documents_user on public.medical_documents(user_id);
create index if not exists idx_documents_date on public.medical_documents(document_date desc);
create index if not exists idx_documents_hash on public.medical_documents(file_hash);
create index if not exists idx_observations_doc on public.extracted_observations(document_id);
create index if not exists idx_observations_flag on public.extracted_observations(flag);
create index if not exists idx_medications_doc on public.medications(document_id);
create index if not exists idx_diagnoses_doc on public.diagnoses(document_id);
create index if not exists idx_summaries_doc on public.document_summaries(document_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.medical_documents enable row level security;
alter table public.extracted_observations enable row level security;
alter table public.medications enable row level security;
alter table public.diagnoses enable row level security;
alter table public.document_summaries enable row level security;

-- Policies for Authenticated Users (users can only access their own data)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can view own documents" on public.medical_documents
  for select using (auth.uid() = user_id);

create policy "Users can insert own documents" on public.medical_documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own documents" on public.medical_documents
  for update using (auth.uid() = user_id);

create policy "Users can delete own documents" on public.medical_documents
  for delete using (auth.uid() = user_id);

create policy "Users can view own observations" on public.extracted_observations
  for select using (auth.uid() = user_id);

create policy "Users can insert own observations" on public.extracted_observations
  for insert with check (auth.uid() = user_id);

create policy "Users can view own medications" on public.medications
  for select using (auth.uid() = user_id);

create policy "Users can insert own medications" on public.medications
  for insert with check (auth.uid() = user_id);

create policy "Users can view own diagnoses" on public.diagnoses
  for select using (auth.uid() = user_id);

create policy "Users can insert own diagnoses" on public.diagnoses
  for insert with check (auth.uid() = user_id);

create policy "Users can view own summaries" on public.document_summaries
  for select using (auth.uid() = user_id);

create policy "Users can insert own summaries" on public.document_summaries
  for insert with check (auth.uid() = user_id);
