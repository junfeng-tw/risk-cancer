
import { useState } from "react";
import predict from "./predict";

export default function LiverCancerPredictor() {
  // 定义参数范围限制
  const PARAM_LIMITS = {
    kcnq1: { min: 0, max: 10, step: 0.001 },
    linc01785: { min: 0, max: 10, step: 0.001 },
    age: { min: 18, max: 120, step: 1 },
    afp: { min: 0, max: 1000000, step: 0.1 }, // AFP可以很高
    alb: { min: 10, max: 60, step: 0.1 }, // 白蛋白正常范围约35-55 g/L
    ggt: { min: 0, max: 1000, step: 1 } // γ-GT正常范围约10-60 U/L
  };

  const [inputs, setInputs] = useState({
    kcnq1: "",
    linc01785: "",
    age: "",
    afp: "",
    alb: "",
    ggt: ""
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function calculateScore(kcnq1, linc01785) {
    return kcnq1 * 1.13 + linc01785 * 1.167 - 3.395;
  }

  const validateInput = (name, value) => {
    const limits = PARAM_LIMITS[name];
    if (value === "") return "This field is required";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "Must be a valid number";
    if (numValue < limits.min) return `Minimum value is ${limits.min}`;
    if (numValue > limits.max) return `Maximum value is ${limits.max}`;
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateInput(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const getInputHint = (name) => {
    const limits = PARAM_LIMITS[name];
    return `Range: ${limits.min} - ${limits.max}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate all inputs
    const newErrors = {};
    Object.keys(inputs).forEach(name => {
      const error = validateInput(name, inputs[name]);
      if (error) newErrors[name] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setResult({
        type: "error",
        message: "Please correct the errors in the form."
      });
      setLoading(false);
      return;
    }

    // Convert inputs to numbers
    const values = Object.values(inputs).map(parseFloat);
    
    // Simulate ML processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const [kcnq1, linc01785, age, afp, alb, ggt] = values;
    const score = calculateScore(kcnq1, linc01785);
    const probability = predict([score, age, afp, alb, ggt])[1];

    setResult({
      type: "success",
      probability: probability,
      score: score,
      riskLevel: probability < 0.3 ? "Low" : probability < 0.7 ? "Moderate" : "High",
      afpStatus: afp > 10 ? "Elevated" : "Normal"
    });
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
          <h1 className="text-3xl font-bold text-white">
            Hepatocellular Carcinoma Risk Assessment System
          </h1>
          <p className="text-blue-100 mt-2">
            Powered by Advanced Machine Learning Algorithm & Multi-omics Data Integration
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">EV-derived lncRNA Biomarkers</h2>
                <label className="block">
                  <span className="text-gray-700 font-medium">KCNQ1-AS1 Expression Level</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.kcnq1.step}
                    min={PARAM_LIMITS.kcnq1.min}
                    max={PARAM_LIMITS.kcnq1.max}
                    name="kcnq1"
                    value={inputs.kcnq1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.kcnq1 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter KCNQ1-AS1 value"
                  />
                  {errors.kcnq1 ? (
                    <p className="mt-1 text-sm text-red-600">{errors.kcnq1}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getInputHint('kcnq1')}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">LINC01785 Expression Level</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.linc01785.step}
                    min={PARAM_LIMITS.linc01785.min}
                    max={PARAM_LIMITS.linc01785.max}
                    name="linc01785"
                    value={inputs.linc01785}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.linc01785 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter LINC01785 value"
                  />
                  {errors.linc01785 ? (
                    <p className="mt-1 text-sm text-red-600">{errors.linc01785}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getInputHint('linc01785')}</p>
                  )}
                </label>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">Clinical Parameters</h2>
                <label className="block">
                  <span className="text-gray-700 font-medium">Age (years)</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.age.step}
                    min={PARAM_LIMITS.age.min}
                    max={PARAM_LIMITS.age.max}
                    name="age"
                    value={inputs.age}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter patient age"
                  />
                  {errors.age ? (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getInputHint('age')}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">AFP Level (ng/mL)</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.afp.step}
                    min={PARAM_LIMITS.afp.min}
                    max={PARAM_LIMITS.afp.max}
                    name="afp"
                    value={inputs.afp}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.afp ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter AFP value"
                  />
                  {errors.afp ? (
                    <p className="mt-1 text-sm text-red-600">{errors.afp}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">
                      {getInputHint('afp')} (Values >10 ng/mL considered elevated)
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">Albumin (g/L)</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.alb.step}
                    min={PARAM_LIMITS.alb.min}
                    max={PARAM_LIMITS.alb.max}
                    name="alb"
                    value={inputs.alb}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.alb ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter albumin value"
                  />
                  {errors.alb ? (
                    <p className="mt-1 text-sm text-red-600">{errors.alb}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getInputHint('alb')}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">γ-GT (U/L)</span>
                  <input
                    type="number"
                    step={PARAM_LIMITS.ggt.step}
                    min={PARAM_LIMITS.ggt.min}
                    max={PARAM_LIMITS.ggt.max}
                    name="ggt"
                    value={inputs.ggt}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ggt ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter γ-GT value"
                  />
                  {errors.ggt ? (
                    <p className="mt-1 text-sm text-red-600">{errors.ggt}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">{getInputHint('ggt')}</p>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Calculate Risk Score'
              )}
            </button>
          </form>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              {result.type === 'error' ? (
                <p className="text-red-700">{result.message}</p>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900">Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow">
                      <p className="text-sm text-gray-500">Risk Probability</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(result.probability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow">
                      <p className="text-sm text-gray-500">lncRNA Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {result.score.toFixed(3)}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow">
                      <p className="text-sm text-gray-500">Risk Level</p>
                      <p className={`text-2xl font-bold ${
                        result.riskLevel === 'Low' ? 'text-green-600' :
                        result.riskLevel === 'Moderate' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {result.riskLevel}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow">
                      <p className="text-sm text-gray-500">AFP Status</p>
                      <p className={`text-2xl font-bold ${
                        result.afpStatus === 'Normal' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.afpStatus}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© 2024 HCC Risk Assessment System. All rights reserved.</p>
        <p className="mt-1">
          Published in Nature Communications | DOI: 10.1038/s41467-XXX-XXXXX-X
        </p>
      </div>
    </div>
  );
}
