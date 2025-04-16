import { useState } from 'react';
import { validateInput, validateAllInputs } from '../utils/formUtils';

/**
 * Custom hook for form handling with validation
 * @param {Object} initialValues - Initial form values
 * @returns {Object} - Form state and handlers
 */
export default function useForm(initialValues) {
  const [inputs, setInputs] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Handles input change events
   * @param {Event} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  /**
   * Handles input blur events (validates on blur)
   * @param {Event} e - Blur event
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateInput(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  /**
   * Validates all form inputs
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = validateAllInputs(inputs);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * Resets the form to initial values
   */
  const resetForm = () => {
    setInputs(initialValues);
    setErrors({});
  };
  
  return {
    inputs,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setInputs,
    setErrors
  };
}
