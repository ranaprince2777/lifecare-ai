import sys
import json
import pymupdf

def extract_pdf_text(file_path):
    try:
        doc = pymupdf.open(file_path)
        pages_text = []
        total_chars = 0
        
        for i, page in enumerate(doc):
            text = page.get_text()
            pages_text.append({"page": i + 1, "text": text})
            total_chars += len(text.strip())
            
        full_text = "\n\n".join([p["text"] for p in pages_text])
        
        result = {
            "success": True,
            "pageCount": len(doc),
            "characterCount": total_chars,
            "text": full_text,
            "pages": pages_text,
            "method": "pymupdf",
            "isScanned": False
        }

        # If PDF has no digital embedded text, render page as image for OCR fallback
        if total_chars < 30 and len(doc) > 0:
            import base64
            pix = doc[0].get_pixmap(dpi=150)
            result["isScanned"] = True
            result["pageImageBase64"] = base64.b64encode(pix.tobytes("png")).decode("utf-8")

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "text": ""}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
    extract_pdf_text(sys.argv[1])
