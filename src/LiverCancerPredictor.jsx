
import { useState } from "react";
import { INITIAL_FORM_VALUES, FIELD_GROUPS } from "./constants/paramLimits";
import useForm from "./hooks/useForm";
import predictionService from "./services/predictionService";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import FormSection from "./components/FormSection";
import LoadingButton from "./components/LoadingButton";
import ResultDisplay from "./components/ResultDisplay";

/**
 * Main component for the Liver Cancer Prediction application
 */
export default function LiverCancerPredictor() {
  const [result, setResult] = useState(null);
  const {
    inputs,
    errors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm
  } = useForm(INITIAL_FORM_VALUES);

  /**
   * Handles form submission
   * @param {Event} e - Submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all inputs
    if (!validateForm()) {
      setResult({
        type: "error",
        message: "Please correct the errors in the form."
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const predictionResult = await predictionService.predictRisk(inputs);

      setResult(predictionResult);
    } catch (error) {
      console.error("Prediction error:", error);
      setResult({
        type: "error",
        message: "An error occurred during prediction. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <Header />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Biomarkers Section */}
              <FormSection
                title={FIELD_GROUPS.biomarkers.title}
                fields={FIELD_GROUPS.biomarkers.fields}
                inputs={inputs}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              {/* Clinical Parameters Section */}
              <FormSection
                title={FIELD_GROUPS.clinical.title}
                fields={FIELD_GROUPS.clinical.fields}
                inputs={inputs}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />
            </div>

            <div className="flex justify-center mt-8">
              <LoadingButton loading={isSubmitting} />
            </div>
          </form>

          <ResultDisplay result={result} />
        </div>
      </div>

      <Footer />
    </div>
  );
}
