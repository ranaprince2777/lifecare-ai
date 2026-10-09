# LifeCare AI — Hackathon Demonstration & Presentation Playbook

**Challenge:** Altrix Labs — *AI-Powered Personal Health Copilot*  
**Application Name:** LifeCare AI  
**Live Production URL:** [`https://lifecare-ai-xi.vercel.app`](https://lifecare-ai-xi.vercel.app/)  
**Local Development URL:** `http://localhost:3000`  
**GitHub Repository:** [`https://github.com/ranaprince2777/lifecare-ai`](https://github.com/ranaprince2777/lifecare-ai)  

---

## 1. 3-Minute Live Evaluator Demo Script

### Step 1: Landing Page & Problem Pitch (30 seconds)
1. Open the homepage: [`https://lifecare-ai-xi.vercel.app/`](https://lifecare-ai-xi.vercel.app/)
2. **Key Talking Point:**
   > *"Patients receive dozens of complex medical documents—lab reports, prescriptions, scans, and discharge summaries—spread across physical paper and PDFs. LifeCare AI is a secure, autonomous personal health copilot that turns messy clinical files into structured, understandable, and actionable health insights."*
3. Click **"Launch Copilot"** or navigate directly to **Dashboard**.

### Step 2: Clinical Dashboard & Longitudinal Trends (45 seconds)
1. Open [`/dashboard`](https://lifecare-ai-xi.vercel.app/dashboard)
2. **Key Highlights:**
   - **Metrics Bar:** Shows real-time aggregated metrics (Total Records, Indexed Observations, Abnormal Marker Alerts).
   - **Longitudinal Trends Component:** Scroll to **"Longitudinal Lab Trends"**. Point out:
     - Automatic grouping by test name across multiple visits.
     - Net change ($\Delta$) calculation showing improvement or elevation.
     - **Safety Feature:** Unit mismatch protection (suppresses math if units don't align).
   - **Recent Uploads Feed:** Shows preview of recent diagnostic documents with direct links.

### Step 3: Multi-Modal Document Upload & AI Processing (60 seconds)
1. Open [`/upload`](https://lifecare-ai-xi.vercel.app/upload)
2. **Notice:** Prominent badge reads **"AI Service Configured (Server) ✓"** — zero key prompts needed!
3. Select or drag-and-drop a synthetic sample:
   - **Option A (Digital Lab Report):** `test-fixtures/synthetic_lab_blood_test.pdf`
   - **Option B (Prescription Scan):** `test-fixtures/synthetic_prescription.png`
4. Click **"Analyze Document"**.
5. **Real-time Pipeline in Action:**
   - Text extraction / OCR runs in real-time.
   - Google Gemini parses structured clinical entities.
   - Deterministic mathematical reference range evaluator verifies abnormal values.
   - Plain-language educational summary and Hindi translation are generated.
6. The user is redirected to the generated record detail page (e.g. `/records/[id]`).

### Step 4: Medical Record Analysis & Bilingual Explanation (30 seconds)
1. On the record detail view:
   - **Abnormal Flags:** Point out highlighted abnormal values (e.g., elevated Fasting Glucose or LDL) with reference intervals.
   - **Plain-Language Summary:** Educational explanation written for the patient with non-diagnostic clinical caution.
   - **Doctor Discussion Questions:** Contextual questions prepared for the patient's next appointment.
   - **Hindi Translation Toggle:** Switch to the Hindi tab to show regional language accessibility.
   - **HL7 FHIR R4 Export:** Click the **"Export FHIR R4 Bundle"** button or view `/api/records/[id]/fhir` to show standard clinical interoperability.

### Step 5: Patient Health Profile & ABHA Integration (15 seconds)
1. Open [`/profile`](https://lifecare-ai-xi.vercel.app/profile)
2. **Interactive Mock ABHA ID:**
   - Click **"Generate Mock ABHA ID"** to generate a 14-digit ABDM-compliant identifier (`91-XXXX-XXXX-XXXX`).
   - Click the copy button to copy the ID.
   - Point out the clear disclaimer stating mock prototyping status.

### Step 6: Settings & Architecture Transparency
1. Open [`/settings`](https://lifecare-ai-xi.vercel.app/settings)
2. **Point out:**
   - **AI Configuration Status Card:** Permanent server-side configuration verified. Click **"Test Live Connection"** to show instant handshake (< 1.2s).
   - **Storage Engine Card:** Shows active persistence mode (**Supabase Cloud Mode** or **Local Demo Mode**).

---

## 2. Synthetic Test Fixtures Catalog

All synthetic test files are located in `test-fixtures/` and are 100% compliant with medical privacy standards (no real patient data):

1. **`synthetic_lab_blood_test.pdf`**
   - *Type:* Digital Laboratory PDF
   - *Key Markers:* Fasting Glucose (126 mg/dL - High), HbA1c (6.9% - High), Total Cholesterol (218 mg/dL - High), Creatinine (0.82 mg/dL - Normal).
2. **`synthetic_prescription.png`**
   - *Type:* Printed Outpatient Prescription Image
   - *Key Medications:* Metformin HCl 500mg, Atorvastatin 10mg.
3. **`synthetic_scanned_cbc_report.pdf`**
   - *Type:* Scanned Raster PDF
   - *Key Markers:* White Blood Cells, Hemoglobin, Platelet Count.
4. **`synthetic_discharge_summary.pdf`**
   - *Type:* Hospital Inpatient Discharge Summary
   - *Key Details:* Admission reason, discharge condition, follow-up advice.
5. **`synthetic_ambiguous_incomplete_report.pdf`**
   - *Type:* Incomplete Diagnostic Slip (Missing Reference Intervals)
   - *Behavior:* Demonstrates deterministic safety — marks unstated bounds as `UNCLASSIFIED` and flags for review instead of inventing numbers.
