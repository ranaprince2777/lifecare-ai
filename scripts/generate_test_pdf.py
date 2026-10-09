import pymupdf
import sys
import os

def create_sample_pdf(output_path):
    doc = pymupdf.open()
    page = doc.new_page()
    
    text = """CITY DIAGNOSTIC CLINIC & LABORATORY
Patient: Anita Desai | Age/Gender: 38/F | Date: 05-Apr-2026
Ref by: Dr. Suresh Rao, MD | Lab No: CDC-2026-9921

METABOLIC & BIOCHEMISTRY REPORT
--------------------------------------------------------------------------------
TEST NAME                      RESULT       UNIT         REFERENCE RANGE   FLAG
--------------------------------------------------------------------------------
Fasting Plasma Glucose         112.0        mg/dL        70.0 - 99.0       HIGH
Serum Uric Acid                6.4          mg/dL        2.4 - 5.7         HIGH
Serum Calcium                  9.4          mg/dL        8.6 - 10.2        NORMAL
Total Bilirubin                0.7          mg/dL        0.2 - 1.2         NORMAL
Blood Urea Nitrogen (BUN)      14.0         mg/dL        7.0 - 20.0        NORMAL
--------------------------------------------------------------------------------
Impression: Mild fasting hyperglycemia and mild hyperuricemia.
Verified by Dr. K. Raman, MD (Pathologist).
"""
    rect = pymupdf.Rect(50, 50, 550, 750)
    page.insert_text(pymupdf.Point(50, 70), text, fontsize=11)
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Generated test PDF at: {output_path}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "public/test_report.pdf"
    create_sample_pdf(out)
