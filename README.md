# LifeCare AI — AI-Powered Personal Health Copilot

> Built for the **Altrix Labs Hackathon** problem statement.

LifeCare AI helps individuals upload and organize medical documents (prescriptions, laboratory reports, diagnostic imaging, and discharge summaries) and understand the information in those documents through carefully worded, plain-language explanations.

---

## 🌟 Key Capabilities

1. **Multi-Format Document Upload & Validation**
   - Supports **PDF, JPG, JPEG, and PNG** (up to 10 MB).
   - Cryptographic SHA-256 duplicate detection preventing accidental re-uploads.
   - Client and server-side magic bytes validation.

2. **Dual-Engine Text Extraction & OCR**
   - Embedded digital PDF extraction via `pdf-parse` and Python `PyMuPDF` (`scripts/extract_pdf.py`).
   - Scanned physical prescriptions and imaging prints OCR via `Tesseract.js` (WebAssembly).
   - Text density and clinical vocabulary quality detection (flags blank or corrupted scans).

3. **Structured Clinical Extraction (Gemini 2.5 Flash)**
   - Converts unstructured document text into typed clinical schemas with runtime Zod validation.
   - Extracts: Document Type, Provider/Clinic, Dates, Patient Info, Lab Observations, Medications, and Diagnoses.
   - Strict Grounding: Never invents missing test values, dosages, or diagnoses.

4. **Deterministic Reference-Range Validation Layer**
   - Mathematical parser independent of the language model.
   - Compares measured test values against the source report's reference intervals (`70 - 99 mg/dL`, `< 200`, `> 60`).
   - Flags results as `NORMAL`, `HIGH`, `LOW`, `CRITICAL_HIGH`, `CRITICAL_LOW`, or `UNCLASSIFIED`.
   - Never fabricates reference intervals.

5. **Plain-Language AI Health Summaries & Bilingual Support**
   - Conversational, cautious educational explanations.
   - Out-of-range value highlights strictly grounded in source findings.
   - Suggested personalized questions to ask your doctor.
   - **English & Hindi (Devanagari)** toggle while preserving medical units and dosage instructions.

6. **Unified Health Profile & Chronological Timeline**
   - Interactive milestone timeline sorted by clinical report date with fallback to upload timestamp.
   - Filter by document category (Lab Report, Prescription, Diagnostic, Discharge Summary) and abnormal flags.
   - Patient profile with allergies, chronic conditions, and emergency contacts.
   - Clearly labelled **Mock ABHA ID** (`91-4829-1049-5521 (Demo)`).

7. **HL7 FHIR R4 Standard Interoperability**
   - Converts internal records into standard HL7 FHIR R4 Bundles containing `Patient`, `Observation`, `MedicationStatement`, and `DiagnosticReport` resources.
   - One-click FHIR JSON copy and download.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router with Turbopack) & React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 (Restrained healthcare teal/slate design system) |
| **Icons** | Lucide React |
| **AI Model** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Validation** | Zod Schema Validation |
| **Text Extraction** | `pdf-parse`, `PyMuPDF` (Python 3.14), `Tesseract.js` |
| **Storage & DB** | Hybrid: Local JSON persistence (`data/records.json`) + Supabase PostgreSQL (`supabase/schema.sql`) |
| **Testing** | Vitest (23 automated unit & integration tests) |

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env.local
```
Add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note:** Even without an environment key, you can enter your key directly inside the app under **Settings** (`/settings`) or during document upload! If no key is provided, the app runs with complete synthetic demo fixtures.

### 3. Run Tests
```bash
npm test
```
All 23 automated tests will execute:
- Deterministic reference-range calculations
- File validation & SHA-256 duplicate detection
- HL7 FHIR R4 Bundle conversion
- Chronological timeline sorting and filtering

### 4. Build & Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Application Routes

- `/` — Product landing page with feature architecture and problem statement
- `/dashboard` — Unified health overview, abnormal alerts banner, active medications, recent documents
- `/upload` — Drag-and-drop document upload pipeline with live progress, validation, and side-by-side preview
- `/records` — Medical records archive with search, type filters, and abnormal-only toggle
- `/records/[id]` — Detailed report: AI Summary (English & Hindi), Lab Observations Table, Active Medications, Raw OCR Text, and HL7 FHIR JSON Bundle
- `/timeline` — Chronological history with interactive node markers
- `/profile` — Patient demographics, mock ABHA ID, conditions, allergies
- `/settings` — Gemini API key tester, language switch, and demo data reset

---

## 🩺 Demo Datasets Included

LifeCare AI comes pre-seeded with 4 realistic clinical fixtures:
1. **Comprehensive Metabolic & Lipid Panel** (Quest Diagnostics): Glucose 142 mg/dL [High], HbA1c 6.8% [High], Total Cholesterol 228 mg/dL [High], Triglycerides 190 mg/dL [High], LDL 148 mg/dL [High], Creatinine 0.95 mg/dL [Normal].
2. **Prescription** (Apollo Clinic, Dr. Arvind Sharma): Metformin 500mg BID, Telmisartan 40mg OD, Atorvastatin 20mg OD at bedtime.
3. **Ultrasound Whole Abdomen** (Max Healthcare Radiology): Mild hepatomegaly (15.6 cm) with Grade 1 Fatty Liver (Steatosis), normal gallbladder, kidneys, spleen.
4. **Discharge Summary** (Fortis Hospital): Acute Gastroenteritis with moderate dehydration, IV fluid resuscitation, discharged stable.
