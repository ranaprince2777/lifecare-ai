import pymupdf
import os

def generate_fixtures():
    fixtures_dir = os.path.abspath("test-fixtures")
    os.makedirs(fixtures_dir, exist_ok=True)
    
    # 1. Digital PDF: Comprehensive Blood & Metabolic Panel
    doc1 = pymupdf.open()
    page1 = doc1.new_page(width=595, height=842) # A4
    text_digital = """SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
================================================================================
MEDICARE ADVANCED PATHOLOGY LABORATORIES
Accreditation: NABL-SYNTHETIC-2026 | ISO 15189 Certified

Patient Name: Meera Nambiar          Age / Gender: 44 Years / Female
Sample ID: SYN-LAB-9941             Collection Date: 08-Apr-2026
Referring Clinician: Dr. A. K. Sen, MD (Endocrinology)

TEST NAME                       RESULT      UNIT        REFERENCE RANGE   FLAG
--------------------------------------------------------------------------------
Fasting Plasma Glucose          126.0       mg/dL       70.0 - 99.0       HIGH
Glycated Hemoglobin (HbA1c)      6.9         %           4.0 - 5.6         HIGH
Total Cholesterol               218.0       mg/dL       < 200.0           HIGH
Serum Triglycerides             165.0       mg/dL       < 150.0           HIGH
HDL Cholesterol                 48.0        mg/dL       > 50.0            LOW
LDL Cholesterol                 137.0       mg/dL       < 100.0           HIGH
Serum Creatinine                0.82        mg/dL       0.50 - 1.10       NORMAL
Estimated GFR (eGFR)            98.0        mL/min      > 90.0            NORMAL
--------------------------------------------------------------------------------
CLINICAL IMPRESSION / NOTES:
- Laboratory observations indicate fasting hyperglycemia with elevated glycated hemoglobin.
- Borderline hypercholesterolemia with low HDL and elevated triglycerides.
- Renal filtration markers remain within standard physiological limits.

Notice: This is synthetic demonstration data generated for software testing purposes only.
Verified by: Dr. Neha Kapoor, MD (Pathologist)
"""
    page1.insert_text(pymupdf.Point(40, 50), text_digital, fontsize=10, fontname="courier")
    pdf_path = os.path.join(fixtures_dir, "synthetic_lab_blood_test.pdf")
    doc1.save(pdf_path)
    doc1.close()
    print(f"Created: {pdf_path}")

    # 2. Image Report (PNG): Clinical Prescription
    doc2 = pymupdf.open()
    page2 = doc2.new_page(width=600, height=750)
    text_rx = """SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
============================================================
CITY HEALTH SPECIALTY CLINIC
Dr. Sanjeev Roy, MBBS, MD (Internal Medicine)
Reg No: MCI-SYN-4819 | Date: 08-Apr-2026
Patient: Meera Nambiar | Age: 44 | Sex: Female
Vitals: BP 134/84 mmHg | Pulse 74 bpm | Wt 64 kg

DIAGNOSIS (DOCUMENTED):
1. Type 2 Diabetes Mellitus (E11.9)
2. Mixed Dyslipidemia (E78.2)

PRESCRIPTION (Rx):
1. Tab. Metformin 500 mg
   Take 1 tablet twice daily after meals (Morning & Evening) x 90 days.
   
2. Tab. Atorvastatin 10 mg
   Take 1 tablet once daily at bedtime x 90 days.

CLINICAL ADVICE:
- Dietary carbohydrate restriction; daily 30-min physical exercise.
- Follow up in 3 months with repeat Fasting Glucose and HbA1c.
============================================================
SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
"""
    page2.insert_text(pymupdf.Point(30, 45), text_rx, fontsize=11, fontname="courier")
    pix2 = page2.get_pixmap(dpi=150)
    png_path = os.path.join(fixtures_dir, "synthetic_prescription.png")
    pix2.save(png_path)
    doc2.close()
    print(f"Created: {png_path}")

    # 3. Scanned-style PDF (Pure Rasterized Image inside PDF - Forces OCR)
    # To create a true scanned PDF: render text as an image first, then place that image onto a blank page with NO embedded font text.
    doc3_temp = pymupdf.open()
    p_temp = doc3_temp.new_page(width=595, height=842)
    text_cbc = """SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
================================================================================
METROPOLITAN HEMATOLOGY CENTER
COMPLETE BLOOD COUNT (CBC) REPORT

Patient: Vikram Patel              Age/Gender: 52/M
Date: 07-Apr-2026                 Sample: Whole Blood EDTA
Ref: Dr. Rajesh Nair, MD          Lab ID: SYN-CBC-8812

INVESTIGATION                   RESULT       UNIT         REFERENCE RANGE
--------------------------------------------------------------------------------
Hemoglobin                      14.2         g/dL         13.0 - 17.0
Total Leukocyte Count (WBC)     7800         /cumm        4000 - 10000
Platelet Count                  245000       /cumm        150000 - 450000
Packed Cell Volume (PCV)        42.5         %            40.0 - 50.0
Neutrophils                     62           %            40 - 70
Lymphocytes                     28           %            20 - 40
Eosinophils                     4            %            1 - 6
Monocytes                       6            %            2 - 8
--------------------------------------------------------------------------------
Impression: Normal Complete Blood Count parameters within physiological reference limits.
Verified by: Dr. Anita Sengupta, MD (Hematology)
SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
"""
    p_temp.insert_text(pymupdf.Point(40, 50), text_cbc, fontsize=10, fontname="courier")
    pix_temp = p_temp.get_pixmap(dpi=150)
    img_bytes = pix_temp.tobytes("png")
    doc3_temp.close()

    # Now create new PDF containing ONLY the image (no selectable text)
    doc3 = pymupdf.open()
    page3 = doc3.new_page(width=595, height=842)
    page3.insert_image(page3.rect, stream=img_bytes)
    scanned_pdf_path = os.path.join(fixtures_dir, "synthetic_scanned_cbc_report.pdf")
    doc3.save(scanned_pdf_path)
    doc3.close()
    print(f"Created: {scanned_pdf_path}")

    # 4. Discharge Summary Document (Hospital Inpatient Discharge)
    doc4 = pymupdf.open()
    page4 = doc4.new_page(width=595, height=842)
    text_discharge = """SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
================================================================================
APEX MULTISPECIALTY HOSPITAL & RESEARCH INSTITUTE
DEPARTMENT OF CARDIOLOGY & INTERNAL MEDICINE
DISCHARGE SUMMARY

Patient Name: Rajesh Sharma            Age / Sex: 58 Y / Male
UHID: APEX-2026-88192                  IPD No: IPD-7721
Admission Date: 02-Apr-2026            Discharge Date: 05-Apr-2026
Consultant: Dr. Arvind Deshmukh, MD, DM (Cardiology)

FINAL DIAGNOSES:
1. Acute Coronary Syndrome (Non-ST Elevation Myocardial Infarction - NSTEMI)
2. Primary Essential Hypertension (Grade II)
3. Dyslipidemia

HOSPITAL COURSE & INTERVENTION:
Patient presented with retrosternal chest discomfort and dyspnea on 02-Apr-2026.
Coronary angiography performed on 03-Apr-2026 revealed 85% proximal LAD stenosis.
Successful drug-eluting stent (DES) placement to proximal LAD without complications.
Hemodynamically stable post-procedure with resolution of angina symptoms.

DISCHARGE MEDICATIONS (Rx):
1. Tab. Aspirin 75 mg — 1 tablet once daily after lunch x 12 months.
2. Tab. Clopidogrel 75 mg — 1 tablet once daily after breakfast x 12 months.
3. Tab. Atorvastatin 40 mg — 1 tablet once daily at bedtime x indefinite.
4. Tab. Metoprolol Succinate 25 mg — 1 tablet once daily morning x 6 months.
5. Tab. Ramipril 2.5 mg — 1 tablet once daily morning x indefinite.

FOLLOW-UP & INSTRUCTIONS:
- Review in Cardiology OPD on 19-Apr-2026 (2 weeks) with repeat ECG.
- Strict low-salt (< 3g/day), low-cholesterol diet. Avoid strenuous exertion.
- Immediate emergency consultation if recurrent chest pain, syncope, or breathlessness occurs.
================================================================================
Verified by: Dr. Arvind Deshmukh, MD, DM | Resident: Dr. Sneha Patil, MBBS
SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
"""
    page4.insert_text(pymupdf.Point(40, 45), text_discharge, fontsize=9.5, fontname="courier")
    discharge_pdf_path = os.path.join(fixtures_dir, "synthetic_discharge_summary.pdf")
    doc4.save(discharge_pdf_path)
    doc4.close()
    print(f"Created: {discharge_pdf_path}")

    # 5. Ambiguous & Incomplete Report (Missing reference ranges, missing clinician, ambiguous values)
    doc5 = pymupdf.open()
    page5 = doc5.new_page(width=595, height=842)
    text_ambiguous = """SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
================================================================================
COMMUNITY HEALTH DIAGNOSTIC POST
PRELIMINARY TEST SLIP (PARTIAL / UNVERIFIED)

Patient: Anita Roy                     Age: 38
Date: Unknown / Illegible (04-?-2026)  Doctor: Unspecified / Walk-in

INVESTIGATION                   RESULT       UNIT         REFERENCE RANGE
--------------------------------------------------------------------------------
Blood Glucose (Random)          142          mg/dL        [NOT PROVIDED]
Urine Protein                   Trace        --           [NOT SPECIFIED]
Serum Calcium                   Borderline   --           [REFERENCE MISSING]
Hemoglobin                      11.2         g/dL         12.0 - 15.0 (LOW)
Thyroid Stimulating Hormone     Pending      uIU/mL       [AWAITING LAB BATCH]
--------------------------------------------------------------------------------
NOTES:
- Specimen hemolyzed slightly. Sample stability uncertain.
- Doctor signature missing. Patient requested preliminary photocopy.
- Serum calcium marked qualitatively as 'Borderline' without numeric assay.
================================================================================
SYNTHETIC TEST DATA — NOT A REAL MEDICAL REPORT
"""
    page5.insert_text(pymupdf.Point(40, 50), text_ambiguous, fontsize=10, fontname="courier")
    ambiguous_pdf_path = os.path.join(fixtures_dir, "synthetic_ambiguous_incomplete_report.pdf")
    doc5.save(ambiguous_pdf_path)
    doc5.close()
    print(f"Created: {ambiguous_pdf_path}")

if __name__ == "__main__":
    generate_fixtures()

