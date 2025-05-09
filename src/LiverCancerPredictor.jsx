
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
import BatchPrediction from "./components/BatchPrediction";

/**
 * Main component for the Liver Cancer Prediction application
 */
export default function LiverCancerPredictor() {
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('individual');
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

    // 记录开始时间
    const startTime = Date.now();

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
      // 计算已经过去的时间
      const elapsedTime = Date.now() - startTime;

      // 如果处理时间少于1秒，则等待剩余时间再关闭加载状态
      if (elapsedTime < 1000) {
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000 - elapsedTime);
      } else {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 min-h-screen">

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 shadow-xl rounded-2xl overflow-hidden">
        <Header />

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-medium ${activeTab === 'individual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('individual')}
          >
            Individual Prediction
          </button>
          <button
            className={`py-3 px-4 sm:py-4 sm:px-6 text-xs sm:text-sm font-medium ${activeTab === 'batch' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('batch')}
          >
            Batch Prediction
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {activeTab === 'individual' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                  {/* Biomarkers Section */}
                  <FormSection
                    title={FIELD_GROUPS.biomarkers.title}
                    subtitle={FIELD_GROUPS.biomarkers.subtitle}
                    fields={FIELD_GROUPS.biomarkers.fields}
                    inputs={inputs}
                    errors={errors}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                  />

                  {/* Clinical Parameters Section */}
                  <FormSection
                    title={FIELD_GROUPS.clinical.title}
                    subtitle={FIELD_GROUPS.clinical.subtitle}
                    fields={FIELD_GROUPS.clinical.fields}
                    inputs={inputs}
                    errors={errors}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                  />
                </div>

                <div className="flex justify-center mt-6 sm:mt-8">
                  <LoadingButton loading={isSubmitting} />
                </div>
              </form>

              {/* 加载中显示占位符，非加载状态显示结果 */}
              {isSubmitting && result ? (
                <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200 animate-pulse">
                  <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-200 rounded"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ) : (
                <ResultDisplay result={result} />
              )}
            </>
          ) : (
            <BatchPrediction />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
