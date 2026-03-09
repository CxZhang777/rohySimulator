/**
 * Investigation Templates
 * Common lab tests and radiology studies with standard formats
 */

export const LAB_TEMPLATES = {
  troponin: {
    name: "Troponin I",
    category: "Cardiac Markers",
    type: "lab",
    turnaround: 45,
    parameters: [
      { name: "Troponin I", unit: "ng/mL", normalRange: "0-0.04" }
    ]
  },
  
  cbc: {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    type: "lab",
    turnaround: 30,
    parameters: [
      { name: "WBC", unit: "×10⁹/L", normalRange: "4.5-11.0" },
      { name: "RBC", unit: "×10¹²/L", normalRange: "4.5-5.5 (M), 4.0-5.0 (F)" },
      { name: "Hemoglobin", unit: "g/dL", normalRange: "13.5-17.5 (M), 12.0-15.5 (F)" },
      { name: "Hematocrit", unit: "%", normalRange: "38-50 (M), 36-44 (F)" },
      { name: "Platelets", unit: "×10⁹/L", normalRange: "150-400" }
    ]
  },
  
  bmp: {
    name: "Basic Metabolic Panel (BMP)",
    category: "Chemistry",
    type: "lab",
    turnaround: 30,
    parameters: [
      { name: "Sodium", unit: "mmol/L", normalRange: "136-145" },
      { name: "Potassium", unit: "mmol/L", normalRange: "3.5-5.0" },
      { name: "Chloride", unit: "mmol/L", normalRange: "98-107" },
      { name: "CO2", unit: "mmol/L", normalRange: "23-29" },
      { name: "BUN", unit: "mg/dL", normalRange: "7-20" },
      { name: "Creatinine", unit: "mg/dL", normalRange: "0.6-1.2" },
      { name: "Glucose", unit: "mg/dL", normalRange: "70-100" }
    ]
  },
  
  abg: {
    name: "Arterial Blood Gas (ABG)",
    category: "Blood Gas",
    type: "lab",
    turnaround: 15,
    parameters: [
      { name: "pH", unit: "", normalRange: "7.35-7.45" },
      { name: "PaCO2", unit: "mmHg", normalRange: "35-45" },
      { name: "PaO2", unit: "mmHg", normalRange: "80-100" },
      { name: "HCO3", unit: "mmol/L", normalRange: "22-26" },
      { name: "Base Excess", unit: "mmol/L", normalRange: "-2 to +2" }
    ]
  },
  
  lipase: {
    name: "Lipase",
    category: "Chemistry",
    type: "lab",
    turnaround: 45,
    parameters: [
      { name: "Lipase", unit: "U/L", normalRange: "0-160" }
    ]
  },
  
  d_dimer: {
    name: "D-Dimer",
    category: "Coagulation",
    type: "lab",
    turnaround: 60,
    parameters: [
      { name: "D-Dimer", unit: "mg/L FEU", normalRange: "<0.5" }
    ]
  },
  
  bnp: {
    name: "BNP (B-type Natriuretic Peptide)",
    category: "Cardiac Markers",
    type: "lab",
    turnaround: 45,
    parameters: [
      { name: "BNP", unit: "pg/mL", normalRange: "<100" }
    ]
  },
  
  lactate: {
    name: "Lactate",
    category: "Chemistry",
    type: "lab",
    turnaround: 15,
    parameters: [
      { name: "Lactate", unit: "mmol/L", normalRange: "0.5-1.6" }
    ]
  }
};

export const RADIOLOGY_TEMPLATES = {
  chest_xray: {
    name: "Chest X-ray (PA & Lateral)",
    category: "Radiology",
    type: "radiology",
    turnaround: 60,
    views: ["PA", "Lateral"],
    interpretation: "Findings to be filled in case design"
  },
  
  chest_xray_portable: {
    name: "Chest X-ray (Portable AP)",
    category: "Radiology",
    type: "radiology",
    turnaround: 30,
    views: ["AP"],
    interpretation: "Findings to be filled in case design"
  },
  
  ct_head: {
    name: "CT Head (Non-Contrast)",
    category: "Radiology",
    type: "radiology",
    turnaround: 45,
    views: ["Axial"],
    interpretation: "Findings to be filled in case design"
  },
  
  ct_chest: {
    name: "CT Chest (With Contrast)",
    category: "Radiology",
    type: "radiology",
    turnaround: 60,
    views: ["Axial", "Coronal", "Sagittal"],
    interpretation: "Findings to be filled in case design"
  },
  
  ct_abdomen: {
    name: "CT Abdomen/Pelvis (With Contrast)",
    category: "Radiology",
    type: "radiology",
    turnaround: 60,
    views: ["Axial", "Coronal"],
    interpretation: "Findings to be filled in case design"
  },
  
  ecg_12lead: {
    name: "12-Lead ECG",
    category: "Cardiac",
    type: "radiology",
    turnaround: 5,
    views: ["12-Lead"],
    interpretation: "Findings to be filled in case design"
  }
};

/**
 * Get all templates as a flat array
 */
export const getAllTemplates = () => {
  const labs = Object.values(LAB_TEMPLATES);
  const radiology = Object.values(RADIOLOGY_TEMPLATES);
  return [...labs, ...radiology];
};

/**
 * Get template by name
 */
export const getTemplateByName = (name) => {
  const allTemplates = { ...LAB_TEMPLATES, ...RADIOLOGY_TEMPLATES };
  return Object.values(allTemplates).find(t => t.name === name);
};

/**
 * Create empty result data from template
 */
export const createEmptyResultData = (template) => {
  if (template.type === 'lab' && template.parameters) {
    return template.parameters.reduce((acc, param) => {
      acc[param.name] = {
        value: null,
        unit: param.unit,
        normalRange: param.normalRange,
        flag: '' // '', 'HIGH', 'LOW', 'CRITICAL'
      };
      return acc;
    }, {});
  }
  
  if (template.type === 'radiology') {
    return {
      interpretation: template.interpretation || '',
      findings: []
    };
  }
  
  return {};
};
