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

if __name__ == "__main__":
    generate_fixtures()
