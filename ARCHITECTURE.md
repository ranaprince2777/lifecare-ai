# LifeCare AI — Architecture & Implementation Plan

## 1. System Overview
LifeCare AI is an AI-powered personal health copilot built for the Altrix Labs hackathon problem statement. It transforms medical documents (prescriptions, laboratory reports, diagnostic imaging reports, and discharge summaries) into plain-language summaries, validated structured data, reference-range evaluated observations, and a unified health profile and chronological timeline.

## 2. Architecture & Modules

### A. Processing Pipeline (`src/lib/pipeline/`)
1. **Document Ingestion & Validation** (`documentValidator.ts`):
   - Mime-type verification (`application/pdf`, `image/png`, `image/jpeg`)
   - File size limits (up to 10MB)
   - SHA-256 duplicate detection
2. **Text Extraction & OCR** (`textExtractor.ts`):
   - PDF embedded text extraction via `pdf-parse` with fallback to `PyMuPDF` (`scripts/extract_pdf.py`)
   - Scanned PDF & image OCR via `tesseract.js` (WebAssembly OCR)
   - Quality detection (detect empty, garbled, or low-density text)
3. **Structured Medical Extraction** (`geminiExtractor.ts`):
   - Gemini API integration with typed schemas (`src/lib/types/medical.ts`)
   - Zod schema validation for strict type guarantees
   - Distinguishes source-reported information vs AI-inferred fields
   - Confidence scoring & review flags
4. **Deterministic Reference-Range Validation** (`referenceRangeValidator.ts`):
   - Independent numeric parser supporting ranges (`13.5 - 17.5`), inequalities (`< 200`, `> 60`), and intervals
   - Flags: `NORMAL`, `HIGH`, `LOW`, `CRITICAL_HIGH`, `CRITICAL_LOW`, `UNCLASSIFIED`
   - Does NOT invent missing reference ranges or make clinical diagnoses
5. **Plain-Language Health Summary** (`healthSummary.ts`):
   - Grounded explanation in plain conversational language
   - Highlight of abnormal values strictly based on source reference ranges
   - Missing/uncertain information callout
   - Suggested questions for doctor/specialist
   - Bilingual support: English and Hindi translations

### B. Data & Persistence (`src/lib/db/` & `supabase/`)
1. **Supabase Relational Schema** (`supabase/schema.sql`):
   - `profiles`: user health profile, mock ABHA ID, blood group, allergies, conditions
   - `medical_documents`: document metadata, file path, SHA-256 hash, raw text, processing status
   - `extracted_observations`: lab test results, numeric values, units, reference ranges, abnormal flags
   - `medications`: medicine name, dosage, frequency, duration, route, instructions
   - `diagnoses`: condition names, ICD hints, status, provider notes
   - `document_summaries`: plain-language English & Hindi summaries, doctor questions
   - Row Level Security (RLS) policies on all tables
2. **Hybrid Storage Manager** (`src/lib/db/storage.ts`):
   - Works seamlessly with Supabase if `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured
   - Intelligent local demo storage with pre-seeded synthetic fixtures if running offline or without credentials

### C. Application Routes
- `/`: Product landing page showcasing features, workflow, privacy, and sample records
- `/dashboard`: Unified health overview, abnormal metrics alert banner, recent documents, quick stats
- `/upload`: Interactive multi-step upload, progress bar, side-by-side extracted preview, error handling & retry
- `/records`: Filterable & searchable archive by document type, date, abnormal flags
- `/records/[id]`: Detailed record view: original document, structured lab/medication cards, reference-range visualization, bilingual AI summary, FHIR JSON view, and printable export
- `/timeline`: Chronological medical history with interactive markers, type filters, and date sorting
- `/profile`: Comprehensive patient health profile, mock ABHA ID, conditions, allergies, vitals
- `/settings`: Gemini API key configuration (with live test connection), Supabase status, language defaults, synthetic data reset

### D. Testing & Quality Assurance
- Automated tests (`src/lib/__tests__/`):
  - Document validation (type, size, duplicate)
  - Text extraction & OCR failure handling
  - Deterministic reference-range validation logic
  - Structured extraction schema parsing
  - Timeline chronological sorting
