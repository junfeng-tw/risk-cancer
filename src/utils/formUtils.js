import { PARAM_LIMITS } from '../constants/paramLimits';

/**
 * Validates a single input field
 * @param {string} name - Field name
 * @param {string} value - Field value
 * @returns {string|null} - Error message or null if valid
 */
export const validateInput = (name, value) => {
  const limits = PARAM_LIMITS[name];
  if (value === "") return "This field is required";

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "Must be a valid number";
  if (numValue < limits.min) return `Minimum value is ${limits.min}`;
  if (numValue > limits.max) return `Maximum value is ${limits.max}`;

  return null;
};

/**
 * Validates all form inputs
 * @param {Object} inputs - Form input values
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateAllInputs = (inputs) => {
  const errors = {};

  Object.entries(inputs).forEach(([name, value]) => {
    const error = validateInput(name, value);
    if (error) errors[name] = error;
  });

  return errors;
};

/**
 * Calculates the lncRNA score based on KCNQ1-AS1 and LINC01785 values
 * @param {number} kcnq1 - KCNQ1-AS1 expression level
 * @param {number} linc01785 - LINC01785 expression level
 * @returns {number} - Calculated score
 */
export const calculateScore = (kcnq1, linc01785) => {
  return kcnq1 * 1.13 + linc01785 * 1.167 - 3.395;
};

/**
 * Determines risk level based on probability
 * @param {number} probability - Risk probability (0-1)
 * @returns {string} - Risk level (Low, Moderate, High)
 */
export const getRiskLevel = (probability) => {
  if (probability < 0.2) return "Low";
  if (probability < 0.5) return "Moderate";
  return "High";
};