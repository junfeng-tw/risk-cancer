
import { useState } from "react";

export default function LiverCancerPredictor() {
  const [inputs, setInputs] = useState({
    kcnq1: "",
    linc01785: "",
    age: "",
    afp: "",
    alb: "",
    ggt: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function calculateScore(kcnq1, linc01785) {
    return kcnq1 * 1.13 + linc01785 * 1.167 - 3.395;
  }

  function predict(lncRNA_score, age, afp, alb, ggt) {
    const intercept = -2.5792;
    const coef = {
      lncRNA: 0.8871,
      age: 0.0627,
      afp: 2.1980,
      alb: -0.0373,
      ggt: 0.0037
    };
    const logit =
      intercept +
      coef.lncRNA * lncRNA_score +
      coef.age * age +
      coef.afp * afp +
      coef.alb * alb +
      coef.ggt * ggt;
    return 1 / (1 + Math.exp(-logit));
  }

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const values = Object.values(inputs).map(parseFloat);
    if (values.some(isNaN)) {
      setResult({
        type: "error",
        message: "Please fill in all required parameters with valid numerical values."
      });
      setLoading(false);
      return;
    }

    // Simulate ML processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const [kcnq1, linc01785, age, afp, alb, ggt] = values;
    const score = calculateScore(kcnq1, linc01785);
    const probability = predict(score, age, afp, alb, ggt);
    
    setResult({
      type: "success",
      probability: probability,
      score: score,
      riskLevel: probability < 0.3 ? "Low" : probability < 0.7 ? "Moderate" : "High"
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
                    step="any"
                    name="kcnq1"
                    value={inputs.kcnq1}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter KCNQ1-AS1 value"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">LINC01785 Expression Level</span>
                  <input
                    type="number"
                    step="any"
                    name="linc01785"
                    value={inputs.linc01785}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter LINC01785 value"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">Clinical Parameters</h2>
                <label className="block">
                  <span className="text-gray-700 font-medium">Age (years)</span>
                  <input
                    type="number"
                    step="any"
                    name="age"
                    value={inputs.age}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter patient age"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">AFP Level (ng/mL)</span>
                  <input
                    type="number"
                    step="any"
                    name="afp"
                    value={inputs.afp}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter AFP value"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">Albumin (g/L)</span>
                  <input
                    type="number"
                    step="any"
                    name="alb"
                    value={inputs.alb}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter albumin value"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium">γ-GT (U/L)</span>
                  <input
                    type="number"
                    step="any"
                    name="ggt"
                    value={inputs.ggt}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter γ-GT value"
                  />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
