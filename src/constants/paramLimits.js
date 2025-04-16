/**
 * Parameter limits for the liver cancer prediction model
 * Defines the valid ranges and step sizes for each input parameter
 */
export const PARAM_LIMITS = {
  kcnq1: { min: 0,  step: 0.001 },
  linc01785: { min: 0,  step: 0.001 },
  age: { min: 18, max: 120, step: 1 },
  afp: { min: 0, step: 0.1 }, // AFP can be very high
  alb: { min: 10, step: 0.1 }, // Normal albumin range is about 35-55 g/L
  ggt: { min: 0, step: 1 } // Normal γ-GT range is about 10-60 U/L
};

/**
 * Initial form values
 */
export const INITIAL_FORM_VALUES = {
  kcnq1: "",
  linc01785: "",
  age: "",
  afp: "",
  alb: "",
  ggt: ""
};

/**
 * Field groups for organizing the form
 */
export const FIELD_GROUPS = {
  biomarkers: {
    title: "lncRNA Biomarkers",
    subtitle: "EV-derived",
    fields: ["kcnq1", "linc01785"]
  },
  clinical: {
    title: "Liver Function Panel",
    subtitle: "Serum markers & patient data",
    fields: ["age", "afp", "alb", "ggt"]
  }
};

/**
 * Field labels and descriptions
 */
export const FIELD_METADATA = {
  kcnq1: {
    label: "KCNQ1-AS1 Expression Level in EVs",
    placeholder: "Enter KCNQ1-AS1 value"
  },
  linc01785: {
    label: "LINC01785 Expression Level in EVs",
    placeholder: "Enter LINC01785 value"
  },
  age: {
    label: "Age (years)",
    placeholder: "Enter patient age"
  },
  afp: {
    label: "AFP Level (ng/mL)",
    placeholder: "Enter AFP value"
  },
  alb: {
    label: "Albumin (g/L)",
    placeholder: "Enter albumin value"
  },
  ggt: {
    label: "γ-GT (U/L)",
    placeholder: "Enter γ-GT value"
  }
};
