import { MedicalDocumentRecord, PatientProfile } from '../types/medical';

export const DEMO_PATIENT: PatientProfile = {
  id: 'demo-patient-001',
  fullName: 'Rajesh Kumar Verma',
  age: 48,
  gender: 'Male',
  bloodGroup: 'B+',
  mockAbhaId: '91-4829-1049-5521 (Demo)',
  allergies: ['Penicillin (Skin rash)', 'Sulfonamides'],
  chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Mild Dyslipidemia'],
  emergencyContact: {
    name: 'Sunita Verma',
    relationship: 'Spouse',
    phone: '+91 98765 43210',
  },
  metrics: {
    totalDocuments: 4,
    abnormalObservationsCount: 5,
    activeMedicationsCount: 3,
    lastVisitDate: '2026-03-15',
  },
};

export const DEMO_RECORDS: MedicalDocumentRecord[] = [
  // 1. LAB REPORT
  {
    id: 'demo-rec-001',
    fileName: 'Quest_Diagnostics_Comprehensive_Metabolic_Lipid.pdf',
    fileSize: 245800,
    mimeType: 'application/pdf',
    filePath: '/demo-files/Quest_Diagnostics_Comprehensive_Metabolic_Lipid.pdf',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    documentType: 'Lab Report',
    documentDate: '2026-03-15',
    uploadedAt: '2026-03-16T10:15:00Z',
    providerName: 'Quest Diagnostics & LifeCare Labs',
    patientNameExtracted: 'Rajesh K. Verma',
    patientAgeExtracted: 48,
    extractionMethod: 'demo_fixture',
    processingStatus: 'completed',
    rawExtractedText: `QUEST DIAGNOSTICS & LIFECARE LABS
Patient: Rajesh K. Verma | Age/Gender: 48/M | Ref By: Dr. A. Sharma
Sample Collected: 15-Mar-2026 08:30 AM | Report Date: 15-Mar-2026 02:45 PM
--------------------------------------------------------------------------
TEST NAME                   RESULT      UNIT        REFERENCE RANGE   FLAG
--------------------------------------------------------------------------
Fasting Plasma Glucose      142.0       mg/dL       70.0 - 99.0       HIGH
HbA1c (Glycated Hb)         6.8         %           4.0 - 5.6         HIGH
Estimated Avg Glucose (eAG) 148.0       mg/dL       70 - 114          HIGH
Total Cholesterol           228.0       mg/dL       < 200.0           HIGH
Triglycerides               190.0       mg/dL       < 150.0           HIGH
HDL Cholesterol             42.0        mg/dL       > 40.0            NORMAL
LDL Cholesterol (Calc)      148.0       mg/dL       < 100.0           HIGH
Serum Creatinine            0.95        mg/dL       0.70 - 1.30       NORMAL
eGFR (CKD-EPI)              88.0        mL/min/1.73m2 > 60.0          NORMAL
Serum Potassium             4.4         mEq/L       3.5 - 5.1         NORMAL
Serum Sodium                139.0       mEq/L       136 - 145         NORMAL
--------------------------------------------------------------------------
End of Report. Verified by Dr. M. K. Sen, MD (Pathology).`,
    observations: [
      {
        id: 'obs-001-1',
        testName: 'Fasting Plasma Glucose',
        category: 'Metabolic & Glycemic',
        testResultValue: '142.0',
        testResultNumeric: 142.0,
        unit: 'mg/dL',
        referenceRangeRaw: '70.0 - 99.0',
        referenceRangeLow: 70.0,
        referenceRangeHigh: 99.0,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.98,
        requiresReview: false,
        sourceText: 'Fasting Plasma Glucose 142.0 mg/dL 70.0 - 99.0 HIGH',
      },
      {
        id: 'obs-001-2',
        testName: 'HbA1c (Glycated Hemoglobin)',
        category: 'Metabolic & Glycemic',
        testResultValue: '6.8',
        testResultNumeric: 6.8,
        unit: '%',
        referenceRangeRaw: '4.0 - 5.6',
        referenceRangeLow: 4.0,
        referenceRangeHigh: 5.6,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.99,
        requiresReview: false,
        sourceText: 'HbA1c (Glycated Hb) 6.8 % 4.0 - 5.6 HIGH',
      },
      {
        id: 'obs-001-3',
        testName: 'Total Cholesterol',
        category: 'Lipid Profile',
        testResultValue: '228.0',
        testResultNumeric: 228.0,
        unit: 'mg/dL',
        referenceRangeRaw: '< 200.0',
        referenceRangeLow: null,
        referenceRangeHigh: 200.0,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.97,
        requiresReview: false,
        sourceText: 'Total Cholesterol 228.0 mg/dL < 200.0 HIGH',
      },
      {
        id: 'obs-001-4',
        testName: 'Triglycerides',
        category: 'Lipid Profile',
        testResultValue: '190.0',
        testResultNumeric: 190.0,
        unit: 'mg/dL',
        referenceRangeRaw: '< 150.0',
        referenceRangeLow: null,
        referenceRangeHigh: 150.0,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.96,
        requiresReview: false,
        sourceText: 'Triglycerides 190.0 mg/dL < 150.0 HIGH',
      },
      {
        id: 'obs-001-5',
        testName: 'HDL Cholesterol',
        category: 'Lipid Profile',
        testResultValue: '42.0',
        testResultNumeric: 42.0,
        unit: 'mg/dL',
        referenceRangeRaw: '> 40.0',
        referenceRangeLow: 40.0,
        referenceRangeHigh: null,
        flag: 'NORMAL',
        flagSource: 'source_reported',
        confidence: 0.97,
        requiresReview: false,
        sourceText: 'HDL Cholesterol 42.0 mg/dL > 40.0 NORMAL',
      },
      {
        id: 'obs-001-6',
        testName: 'LDL Cholesterol (Calculated)',
        category: 'Lipid Profile',
        testResultValue: '148.0',
        testResultNumeric: 148.0,
        unit: 'mg/dL',
        referenceRangeRaw: '< 100.0',
        referenceRangeLow: null,
        referenceRangeHigh: 100.0,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.95,
        requiresReview: false,
        sourceText: 'LDL Cholesterol (Calc) 148.0 mg/dL < 100.0 HIGH',
      },
      {
        id: 'obs-001-7',
        testName: 'Serum Creatinine',
        category: 'Renal Function',
        testResultValue: '0.95',
        testResultNumeric: 0.95,
        unit: 'mg/dL',
        referenceRangeRaw: '0.70 - 1.30',
        referenceRangeLow: 0.70,
        referenceRangeHigh: 1.30,
        flag: 'NORMAL',
        flagSource: 'source_reported',
        confidence: 0.98,
        requiresReview: false,
        sourceText: 'Serum Creatinine 0.95 mg/dL 0.70 - 1.30 NORMAL',
      },
    ],
    medications: [],
    diagnoses: [],
    summary: {
      id: 'sum-001',
      summaryEn:
        'This laboratory report reflects your recent blood testing covering blood sugar and lipid panels. Your Fasting Blood Glucose (142 mg/dL) and HbA1c (6.8%) are elevated compared to the laboratory reference ranges, indicating that average blood sugar over the last 2-3 months has been above normal thresholds. Additionally, your Total Cholesterol (228 mg/dL) and LDL cholesterol (148 mg/dL) are above the recommended reference targets. Kidney function markers (Creatinine 0.95 mg/dL and eGFR) are currently within the expected normal range. Please note: these values are laboratory observations and do not replace a full medical evaluation by your physician.',
      summaryHi:
        'यह प्रयोगशाला रिपोर्ट आपके रक्त शर्करा (शुगर) और लिपिड (कोलेस्ट्रॉल) की जांच को दर्शाती है। आपका फास्टिंग ग्लूकोज (142 mg/dL) और HbA1c (6.8%) लैब की सामान्य सीमा से अधिक हैं, जिससे संकेत मिलता है कि पिछले 2-3 महीनों में ब्लड शुगर का स्तर बढ़ा हुआ रहा है। इसके अतिरिक्त, कुल कोलेस्ट्रॉल (228 mg/dL) और एलडीएल (148 mg/dL) भी संदर्भ सीमा से ऊपर हैं। गुर्दे (किडनी) से संबंधित जांच (क्रिएटिनिन 0.95 mg/dL) सामान्य सीमा में है। कृपया ध्यान दें: ये परिणाम केवल शैक्षिक जानकारी हैं, अपने डॉक्टर से परामर्श अवश्य लें।',
      keyFindings: [
        'Fasting Blood Glucose is 142.0 mg/dL (Reference: 70 - 99 mg/dL)',
        'HbA1c is 6.8% (Reference: 4.0 - 5.6%)',
        'Total Cholesterol is 228.0 mg/dL (Reference: < 200 mg/dL)',
        'Kidney filtration markers (Creatinine and eGFR) are completely within normal bounds',
      ],
      abnormalHighlights: [
        'Fasting Glucose: 142.0 mg/dL exceeds normal limit (70 - 99 mg/dL)',
        'HbA1c: 6.8% indicates elevated average blood sugar',
        'LDL Cholesterol: 148.0 mg/dL is higher than optimal threshold (< 100 mg/dL)',
        'Triglycerides: 190.0 mg/dL exceeds reference boundary (< 150 mg/dL)',
      ],
      doctorQuestions: [
        'Should we adjust my current diabetes medication or lifestyle plan based on the 6.8% HbA1c?',
        'Do you recommend starting a cholesterol-lowering medication such as a statin for the elevated LDL?',
        'When should I repeat this metabolic panel to monitor these trends?',
      ],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  },

  // 2. PRESCRIPTION
  {
    id: 'demo-rec-002',
    fileName: 'Apollo_Clinic_Prescription_Dr_Sharma.pdf',
    fileSize: 184200,
    mimeType: 'application/pdf',
    filePath: '/demo-files/Apollo_Clinic_Prescription_Dr_Sharma.pdf',
    fileHash: 'a7c1b44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b112',
    documentType: 'Prescription',
    documentDate: '2026-03-18',
    uploadedAt: '2026-03-18T14:30:00Z',
    providerName: 'Apollo Clinic & Family Health Center',
    patientNameExtracted: 'Rajesh Kumar Verma',
    patientAgeExtracted: 48,
    extractionMethod: 'demo_fixture',
    processingStatus: 'completed',
    rawExtractedText: `APOLLO CLINIC & FAMILY HEALTH CENTER
Consultant: Dr. Arvind Sharma, MBBS, MD (Internal Medicine)
Reg No: MCI-28491 | Date: 18-03-2026
Patient: Rajesh Kumar Verma | Age/Sex: 48 / Male
BP: 138/86 mmHg | Pulse: 76 bpm | Weight: 78 kg

DIAGNOSIS / CLINICAL IMPRESSION:
1. Type 2 Diabetes Mellitus - Inadequate glycemic control
2. Essential Hypertension - Stage 1
3. Dyslipidemia

Rx:
1. Tab. Metformin 500 mg — 1 tablet twice daily after meals (Breakfast & Dinner) x 90 days
2. Tab. Telmisartan 40 mg — 1 tablet once daily in the morning before food x 90 days
3. Tab. Atorvastatin 20 mg — 1 tablet once daily at bedtime x 90 days

Advice:
- Low carbohydrate, low saturated fat diet.
- 30 minutes brisk walking daily.
- Review after 3 months with Repeat HbA1c and Lipid Profile.`,
    observations: [
      {
        id: 'obs-002-1',
        testName: 'Blood Pressure (Systolic / Diastolic)',
        category: 'Vitals',
        testResultValue: '138/86',
        testResultNumeric: 138,
        unit: 'mmHg',
        referenceRangeRaw: '< 120/80',
        referenceRangeLow: null,
        referenceRangeHigh: 120,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.95,
        requiresReview: false,
        sourceText: 'BP: 138/86 mmHg',
      },
    ],
    medications: [
      {
        id: 'med-002-1',
        medicationName: 'Metformin',
        dosage: '500 mg',
        frequency: 'Twice daily (BID)',
        duration: '90 days',
        route: 'Oral',
        instructions: 'Take after meals (Breakfast and Dinner)',
        isActive: true,
        confidence: 0.99,
        sourceText: 'Tab. Metformin 500 mg — 1 tablet twice daily after meals x 90 days',
      },
      {
        id: 'med-002-2',
        medicationName: 'Telmisartan',
        dosage: '40 mg',
        frequency: 'Once daily (OD)',
        duration: '90 days',
        route: 'Oral',
        instructions: 'Take in the morning before food',
        isActive: true,
        confidence: 0.98,
        sourceText: 'Tab. Telmisartan 40 mg — 1 tablet once daily in the morning before food x 90 days',
      },
      {
        id: 'med-002-3',
        medicationName: 'Atorvastatin',
        dosage: '20 mg',
        frequency: 'Once daily (OD)',
        duration: '90 days',
        route: 'Oral',
        instructions: 'Take at bedtime',
        isActive: true,
        confidence: 0.98,
        sourceText: 'Tab. Atorvastatin 20 mg — 1 tablet once daily at bedtime x 90 days',
      },
    ],
    diagnoses: [
      {
        id: 'diag-002-1',
        conditionName: 'Type 2 Diabetes Mellitus',
        icd10Code: 'E11.9',
        status: 'Active',
        providerNotes: 'Inadequate glycemic control noted on recent lab tests',
        confidence: 0.99,
        sourceText: 'Type 2 Diabetes Mellitus - Inadequate glycemic control',
      },
      {
        id: 'diag-002-2',
        conditionName: 'Essential Hypertension',
        icd10Code: 'I10',
        status: 'Active',
        providerNotes: 'Stage 1 hypertension, recorded BP 138/86 mmHg',
        confidence: 0.98,
        sourceText: 'Essential Hypertension - Stage 1',
      },
      {
        id: 'diag-002-3',
        conditionName: 'Dyslipidemia',
        icd10Code: 'E78.5',
        status: 'Active',
        providerNotes: 'Elevated total cholesterol and LDL',
        confidence: 0.97,
        sourceText: 'Dyslipidemia',
      },
    ],
    summary: {
      id: 'sum-002',
      summaryEn:
        'This prescription from Dr. Arvind Sharma outlines your management plan for blood sugar, blood pressure, and cholesterol. Three medications have been prescribed: Metformin (500mg twice daily) to help regulate blood glucose; Telmisartan (40mg once morning) for blood pressure control; and Atorvastatin (20mg at bedtime) to reduce cholesterol levels. Dr. Sharma also advised a low-carb, heart-healthy diet, regular physical exercise, and a 3-month follow-up visit with repeat lab tests.',
      summaryHi:
        'डॉ. अरविंद शर्मा का यह पर्चा आपके ब्लड शुगर, ब्लड प्रेशर और कोलेस्ट्रॉल के नियंत्रण हेतु दवाइयों का विवरण देता है। डॉक्टर ने तीन दवाएं लिखी हैं: मेटफॉर्मिन (500mg दिन में दो बार) शुगर नियंत्रण के लिए; टेल्मिसार्टन (40mg सुबह) रक्तचाप नियंत्रण के लिए; और एटोरवास्टेटिन (20mg रात को सोते समय) कोलेस्ट्रॉल घटाने के लिए। डॉक्टर ने 30 मिनट पैदल चलने और 3 महीने बाद दोबारा जांच कराने की सलाह दी है।',
      keyFindings: [
        'Recorded clinic blood pressure was 138/86 mmHg',
        'Three daily medications prescribed for 90 days',
        'Follow-up scheduled in 3 months with repeat HbA1c and lipid profile',
      ],
      abnormalHighlights: ['Clinic Blood Pressure: 138/86 mmHg (Target: < 120/80 mmHg)'],
      doctorQuestions: [
        'Are there specific food interactions or timing guidelines I should follow with Metformin?',
        'What symptoms should prompt an earlier blood pressure or blood sugar check?',
        'Do I need periodic liver enzyme monitoring while on Atorvastatin?',
      ],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  },

  // 3. DIAGNOSTIC REPORT
  {
    id: 'demo-rec-003',
    fileName: 'Max_Healthcare_Ultrasound_Abdomen.pdf',
    fileSize: 312000,
    mimeType: 'application/pdf',
    filePath: '/demo-files/Max_Healthcare_Ultrasound_Abdomen.pdf',
    fileHash: 'c4e2a11298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b779',
    documentType: 'Diagnostic Report',
    documentDate: '2026-02-10',
    uploadedAt: '2026-02-11T09:00:00Z',
    providerName: 'Max Healthcare Imaging & Radiology',
    patientNameExtracted: 'Rajesh Verma',
    patientAgeExtracted: 48,
    extractionMethod: 'demo_fixture',
    processingStatus: 'completed',
    rawExtractedText: `MAX HEALTHCARE IMAGING & RADIOLOGY
ULTRASOUND WHOLE ABDOMEN
Patient: Rajesh Verma | Age/Sex: 48 Y / Male | Date: 10-Feb-2026
Referred by: Dr. A. Sharma

FINDINGS:
LIVER: Mildly enlarged in size measuring 15.6 cm (Normal: up to 15.0 cm). Shows diffuse increase in parenchymal echogenicity with mild posterior beam attenuation, consistent with Grade 1 Fatty Liver (Steatosis). No focal parenchymal mass lesion or cyst noted. Intrahepatic biliary radicals are not dilated. Portal vein is normal in caliber.
GALLBLADDER: Well distended with normal wall thickness. No calculus or sludge seen.
PANCREAS: Visualized head and body appear normal in size and echotexture. Main pancreatic duct is not dilated.
SPLEEN: Normal size (10.2 cm) and homogeneous echotexture. No splenomegaly.
KIDNEYS: Both kidneys are normal in size, shape, and cortical thickness. Right kidney measures 10.4 cm, Left kidney 10.8 cm. Corticomedullary differentiation is preserved. No calculus, hydronephrosis, or solid lesion seen.
URINARY BLADDER: Well distended, wall is smooth. No calculus or intraluminal lesion.
PROSTATE: Normal in size (approx 22 cc). Homogeneous echotexture.

IMPRESSION:
1. Mild Hepatomegaly with Grade 1 Fatty Infiltration of Liver.
2. Otherwise unremarkable ultrasound of the whole abdomen.`,
    observations: [
      {
        id: 'obs-003-1',
        testName: 'Liver Span / Size',
        category: 'Ultrasound Measurements',
        testResultValue: '15.6 cm',
        testResultNumeric: 15.6,
        unit: 'cm',
        referenceRangeRaw: '< 15.0 cm',
        referenceRangeLow: null,
        referenceRangeHigh: 15.0,
        flag: 'HIGH',
        flagSource: 'source_reported',
        confidence: 0.96,
        requiresReview: false,
        sourceText: 'LIVER: Mildly enlarged in size measuring 15.6 cm (Normal: up to 15.0 cm)',
      },
      {
        id: 'obs-003-2',
        testName: 'Spleen Length',
        category: 'Ultrasound Measurements',
        testResultValue: '10.2 cm',
        testResultNumeric: 10.2,
        unit: 'cm',
        referenceRangeRaw: '< 12.0 cm',
        referenceRangeLow: null,
        referenceRangeHigh: 12.0,
        flag: 'NORMAL',
        flagSource: 'calculated',
        confidence: 0.94,
        requiresReview: false,
        sourceText: 'SPLEEN: Normal size (10.2 cm)',
      },
      {
        id: 'obs-003-3',
        testName: 'Prostate Volume',
        category: 'Ultrasound Measurements',
        testResultValue: '22 cc',
        testResultNumeric: 22.0,
        unit: 'cc',
        referenceRangeRaw: '< 25 cc',
        referenceRangeLow: null,
        referenceRangeHigh: 25.0,
        flag: 'NORMAL',
        flagSource: 'calculated',
        confidence: 0.92,
        requiresReview: false,
        sourceText: 'PROSTATE: Normal in size (approx 22 cc)',
      },
    ],
    medications: [],
    diagnoses: [
      {
        id: 'diag-003-1',
        conditionName: 'Grade 1 Fatty Liver (Hepatic Steatosis)',
        icd10Code: 'K76.0',
        status: 'Active',
        providerNotes: 'Diffuse increase in parenchymal echogenicity, mild hepatomegaly',
        confidence: 0.98,
        sourceText: 'Grade 1 Fatty Liver (Steatosis)',
      },
    ],
    summary: {
      id: 'sum-003',
      summaryEn:
        'This ultrasound imaging report examined your abdominal organs. The primary finding is mild enlargement of the liver (15.6 cm, where normal is up to 15 cm) with Grade 1 fatty liver (hepatic steatosis). Grade 1 indicates early, mild fat accumulation in liver tissue, very frequently seen with metabolic conditions like high blood sugar or cholesterol. Importantly, all other evaluated abdominal organs—including gallbladder, kidneys, pancreas, and spleen—showed completely normal structure with no stones or masses.',
      summaryHi:
        'यह अल्ट्रासाउंड रिपोर्ट आपके पेट के अंगों की जांच दर्शाती है। मुख्य निष्कर्ष यह है कि लिवर का आकार हल्का सा बढ़ा हुआ (15.6 सेमी, सामान्य सीमा 15 सेमी तक) है और ग्रेड 1 फैटी लिवर (चर्बी का जमाव) पाया गया है। ग्रेड 1 शुरुआती फैटी लिवर को दर्शाता है, जो ब्लड शुगर या कोलेस्ट्रॉल बढ़ने पर अक्सर देखा जाता है। राहत की बात यह है कि पित्ताशय, गुर्दे (किडनी), अग्न्याशय और तिल्ली पूरी तरह से सामान्य हैं।',
      keyFindings: [
        'Liver size is mildly enlarged at 15.6 cm (Normal upper bound: 15.0 cm)',
        'Grade 1 fatty liver (steatosis) noted',
        'Gallbladder, kidneys, pancreas, and spleen are structurally normal',
      ],
      abnormalHighlights: ['Liver: Mild hepatomegaly (15.6 cm) with Grade 1 Fatty Infiltration'],
      doctorQuestions: [
        'What dietary changes or aerobic exercise can help reverse early Grade 1 fatty liver?',
        'Do I need liver function blood tests (SGOT/SGPT) to check for inflammation?',
        'When should a follow-up ultrasound be scheduled to monitor liver size?',
      ],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  },

  // 4. DISCHARGE SUMMARY
  {
    id: 'demo-rec-004',
    fileName: 'Fortis_Hospital_Discharge_Summary.pdf',
    fileSize: 420500,
    mimeType: 'application/pdf',
    filePath: '/demo-files/Fortis_Hospital_Discharge_Summary.pdf',
    fileHash: 'f8d3a11298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b998',
    documentType: 'Discharge Summary',
    documentDate: '2025-11-22',
    uploadedAt: '2025-11-23T11:00:00Z',
    providerName: 'Fortis Escorts Hospital',
    patientNameExtracted: 'Rajesh Kumar Verma',
    patientAgeExtracted: 47,
    extractionMethod: 'demo_fixture',
    processingStatus: 'completed',
    rawExtractedText: `FORTIS ESCORTS HOSPITAL - DEPARTMENT OF GENERAL MEDICINE
DISCHARGE SUMMARY
IPD No: 2025-84912 | UHID: FE-992104
Patient Name: Mr. Rajesh Kumar Verma | Age/Sex: 47 / Male
Date of Admission: 20-Nov-2025 (10:15 PM) | Date of Discharge: 22-Nov-2025 (02:00 PM)
Attending Physician: Dr. Sunita Mehra, MD (Medicine)

FINAL DIAGNOSIS:
Acute Gastroenteritis with Moderate Dehydration.

CHIEF COMPLAINTS:
Patient presented with loose watery stools (8-10 episodes), recurrent vomiting, low-grade fever, and generalized weakness for 24 hours prior to admission.

HOSPITAL COURSE:
Patient was admitted to Day Care/Medical Ward. Immediate intravenous hydration with Ringer Lactate and Normal Saline was initiated. Empirical antiemetic (Inj. Ondansetron) and antipyretic (Inj. Paracetamol) were administered. Stool examination showed no ova or parasites. Serum electrolytes normalized within 24 hours. Oral fluids tolerated well by day 2. Patient discharged in hemodynamically stable condition.

DISCHARGE MEDICATIONS:
1. Tab. Ofloxacin + Ornidazole (200/500 mg) — 1 tab twice daily x 3 days
2. Tab. Pantoprazole 40 mg — 1 tab once daily before breakfast x 7 days
3. Sachet Oral Rehydration Salts (ORS) — Dilute in 1 liter boiled cooled water, drink as required x 3 days
4. Probiotic Capsule — 1 capsule twice daily x 5 days

DISCHARGE CONDITION: Stable, afebrile, tolerating oral diet.`,
    observations: [],
    medications: [
      {
        id: 'med-004-1',
        medicationName: 'Ofloxacin + Ornidazole',
        dosage: '200/500 mg',
        frequency: 'Twice daily',
        duration: '3 days',
        route: 'Oral',
        instructions: 'Take after meals for 3 days',
        isActive: false, // completed
        confidence: 0.98,
        sourceText: 'Tab. Ofloxacin + Ornidazole (200/500 mg) — 1 tab twice daily x 3 days',
      },
      {
        id: 'med-004-2',
        medicationName: 'Pantoprazole',
        dosage: '40 mg',
        frequency: 'Once daily',
        duration: '7 days',
        route: 'Oral',
        instructions: 'Take before breakfast in the morning',
        isActive: false,
        confidence: 0.98,
        sourceText: 'Tab. Pantoprazole 40 mg — 1 tab once daily before breakfast x 7 days',
      },
    ],
    diagnoses: [
      {
        id: 'diag-004-1',
        conditionName: 'Acute Gastroenteritis with Moderate Dehydration',
        icd10Code: 'A09',
        status: 'Resolved',
        providerNotes: 'Treated with IV hydration and antiemetics; resolved on discharge',
        confidence: 0.99,
        sourceText: 'Acute Gastroenteritis with Moderate Dehydration',
      },
    ],
    summary: {
      id: 'sum-004',
      summaryEn:
        'This hospital discharge summary covers a brief 2-day admission in November 2025 for acute gastroenteritis (stomach bug) with moderate dehydration. The patient was rehydrated with intravenous fluids and given supportive care. Symptoms fully resolved and the patient was discharged in stable condition with a short course of oral rehydration and gut recovery medications (now completed).',
      summaryHi:
        'यह डिस्चार्ज सारांश नवंबर 2025 में पेट के संक्रमण (गैस्ट्रोएंटेराइटिस) और निर्जलीकरण (डिहाइड्रेशन) के लिए अस्पताल में 2 दिन के उपचार का विवरण है। अंतःशिरा (IV) ड्रिप और दवाओं से मरीज की स्थिति पूरी तरह स्थिर हो गई और स्वास्थ्य लाभ के बाद छुट्टी दे दी गई। यह समस्या अब पूरी तरह ठीक हो चुकी है।',
      keyFindings: [
        'Admitted for acute gastroenteritis with moderate dehydration',
        'Successfully treated with intravenous hydration and discharged stable',
        'Condition is marked as resolved',
      ],
      abnormalHighlights: [],
      doctorQuestions: [
        'Since this episode resolved, are any ongoing digestive precautions necessary?',
      ],
      modelUsed: 'gemini-3.1-flash-lite',
    },
  },
];
