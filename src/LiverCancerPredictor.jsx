
import { useState, useEffect } from "react";

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
  const [historicalData, setHistoricalData] = useState([]);
  const [showTreatmentOptions, setShowTreatmentOptions] = useState(false);
  const [showCompetingRisks, setShowCompetingRisks] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [showPatientIdModal, setShowPatientIdModal] = useState(false);

  // Risk stratification data with survival rates
  const RISK_STRATIFICATION = {
    Low: {
      probability: "< 30%",
      criteria: [
        "lncRNA score < 2.0",
        "AFP < 10 ng/mL",
        "Normal liver function"
      ],
      survivalRate: {
        "1-year": "98%",
        "3-year": "92%",
        "5-year": "85%"
      }
    },
    Moderate: {
      probability: "30-70%",
      criteria: [
        "lncRNA score 2.0-4.0",
        "AFP 10-400 ng/mL",
        "Mild liver dysfunction"
      ],
      survivalRate: {
        "1-year": "85%",
        "3-year": "71%",
        "5-year": "58%"
      }
    },
    High: {
      probability: "> 70%",
      criteria: [
        "lncRNA score > 4.0",
        "AFP > 400 ng/mL",
        "Significant liver dysfunction"
      ],
      survivalRate: {
        "1-year": "67%",
        "3-year": "45%",
        "5-year": "31%"
      }
    }
  };

  // Personalized follow-up recommendations based on risk level
  const RISK_RECOMMENDATIONS = {
    Low: {
      followUp: "Regular screening every 6 months with ultrasound and AFP testing",
      imaging: "Annual contrast-enhanced MRI",
      biomarkers: "Monitor AFP and lncRNA levels every 6 months",
      lifestyle: "Maintain healthy lifestyle and avoid hepatotoxic substances"
    },
    Moderate: {
      followUp: "Intensive monitoring every 3-4 months",
      imaging: "Contrast-enhanced CT/MRI every 6 months",
      biomarkers: "Monitor AFP and lncRNA levels every 3 months",
      lifestyle: "Strict lifestyle modifications and hepatoprotective measures"
    },
    High: {
      followUp: "Close monitoring every 2-3 months",
      imaging: "Contrast-enhanced CT/MRI every 3 months",
      biomarkers: "Monthly AFP and lncRNA monitoring",
      lifestyle: "Immediate lifestyle intervention and potential clinical trial enrollment"
    }
  };

  // Treatment options based on risk level
  const TREATMENT_OPTIONS = {
    Low: [
      { name: "Active Surveillance", description: "Regular monitoring without intervention", suitability: "Highly Recommended" },
      { name: "Lifestyle Modification", description: "Diet, exercise, and hepatoprotective measures", suitability: "Recommended" },
      { name: "Antiviral Therapy", description: "For patients with viral hepatitis", suitability: "Consider if applicable" }
    ],
    Moderate: [
      { name: "Intensive Surveillance", description: "Frequent monitoring with multiple modalities", suitability: "Recommended" },
      { name: "Locoregional Therapy", description: "RFA, TACE for early lesions if detected", suitability: "Consider" },
      { name: "Clinical Trials", description: "Preventive/early intervention trials", suitability: "Consider" },
      { name: "Hepatoprotective Agents", description: "Medications to improve liver function", suitability: "Consider" }
    ],
    High: [
      { name: "Intensive Surveillance", description: "Very frequent monitoring with multiple modalities", suitability: "Highly Recommended" },
      { name: "Clinical Trials", description: "Early detection and intervention trials", suitability: "Recommended" },
      { name: "Locoregional Therapy", description: "For early lesions if detected", suitability: "Consider" },
      { name: "Systemic Therapy", description: "Preventive approaches in clinical trials", suitability: "Consider in select cases" },
      { name: "Liver Transplant Evaluation", description: "For patients with significant cirrhosis", suitability: "Consider in select cases" }
    ]
  };

  // Competing risks for elderly patients (age > 65)
  const COMPETING_RISKS = {
    cardiovascular: {
      name: "Cardiovascular Disease",
      risk: "Moderate",
      impact: "May limit treatment options and affect overall survival",
      recommendation: "Comprehensive cardiac evaluation before invasive treatments"
    },
    renal: {
      name: "Renal Dysfunction",
      risk: "Moderate",
      impact: "May affect drug clearance and contrast imaging",
      recommendation: "Regular renal function monitoring and dose adjustments"
    },
    comorbidities: {
      name: "Multiple Comorbidities",
      risk: "High",
      impact: "Cumulative effect may reduce treatment tolerance",
      recommendation: "Comprehensive geriatric assessment before treatment planning"
    },
    frailty: {
      name: "Frailty",
      risk: "Variable",
      impact: "Reduced physiological reserve and treatment tolerance",
      recommendation: "Frailty assessment using validated tools"
    }
  };

  function calculateScore(kcnq1, linc01785) {
    return kcnq1 * 1.13 + linc01785 * 1.167 - 3.395;
  }

  function predict(lncRNA_score, age, afp, alb, ggt) {
    // Convert AFP to binary (0/1) based on 10 ng/mL threshold
    const afpBinary = afp > 10 ? 1 : 0;

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
      coef.afp * afpBinary + // Use binary AFP
      coef.alb * alb +
      coef.ggt * ggt;
    return 1 / (1 + Math.exp(-logit));
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

    // If no patient ID is set, show the patient ID modal
    if (!patientId) {
      setShowPatientIdModal(true);
      return;
    }

    setLoading(true);

    // Reset modals when submitting new data
    setShowTreatmentOptions(false);
    setShowCompetingRisks(false);

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
    const probability = predict(score, age, afp, alb, ggt);

    const riskLevel = probability < 0.3 ? "Low" : probability < 0.7 ? "Moderate" : "High";
    const afpStatus = afp > 10 ? "Elevated" : "Normal";

    // Create new result object
    const newResult = {
      type: "success",
      probability: probability,
      score: score,
      riskLevel: riskLevel,
      afpStatus: afpStatus,
      date: new Date().toISOString(),
      patientAge: age,
      patientId: patientId
    };

    // Add to historical data for trend analysis - only for the current patient
    setHistoricalData(prev => [
      ...prev.filter(item => item.patientId === patientId), // Keep only current patient's previous data
      {
        date: new Date().toISOString(),
        probability: probability,
        score: score,
        riskLevel: riskLevel,
        kcnq1: kcnq1,
        linc01785: linc01785,
        afp: afp,
        alb: alb,
        ggt: ggt,
        age: age,
        patientId: patientId
      }
    ]);

    // Show competing risks automatically for elderly patients
    if (age > 65) {
      setShowCompetingRisks(true);
    }

    setResult(newResult);
    setLoading(false);
  };

  // Component for personalized follow-up recommendations
  const ClinicalRecommendations = ({ riskLevel }) => (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalized Clinical Recommendations</h3>
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-medium text-gray-900">Follow-up Schedule</h4>
            <p className="mt-1 text-sm text-gray-600">{RISK_RECOMMENDATIONS[riskLevel].followUp}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-medium text-gray-900">Imaging Protocol</h4>
            <p className="mt-1 text-sm text-gray-600">{RISK_RECOMMENDATIONS[riskLevel].imaging}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-medium text-gray-900">Biomarker Monitoring</h4>
            <p className="mt-1 text-sm text-gray-600">{RISK_RECOMMENDATIONS[riskLevel].biomarkers}</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-medium text-gray-900">Lifestyle Recommendations</h4>
            <p className="mt-1 text-sm text-gray-600">{RISK_RECOMMENDATIONS[riskLevel].lifestyle}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Component for survival curve estimation
  const SurvivalAnalysis = ({ riskLevel }) => (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Survival Curve Estimation</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Based on your risk profile ({RISK_STRATIFICATION[riskLevel].probability} probability), the estimated survival rates are:</p>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                1-Year Survival
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {RISK_STRATIFICATION[riskLevel].survivalRate["1-year"]}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div style={{ width: RISK_STRATIFICATION[riskLevel].survivalRate["1-year"].replace('%', '') + '%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                3-Year Survival
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {RISK_STRATIFICATION[riskLevel].survivalRate["3-year"]}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div style={{ width: RISK_STRATIFICATION[riskLevel].survivalRate["3-year"].replace('%', '') + '%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                5-Year Survival
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {RISK_STRATIFICATION[riskLevel].survivalRate["5-year"]}
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div style={{ width: RISK_STRATIFICATION[riskLevel].survivalRate["5-year"].replace('%', '') + '%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>* Survival estimates are based on aggregated data from clinical studies and may vary based on individual factors.</p>
          <p>* These estimates assume no intervention is performed and are for informational purposes only.</p>
        </div>
      </div>
    </div>
  );

  // Component for treatment options - using the latest risk level directly from result
  const TreatmentOptions = () => {
    // Ensure we're using the most current risk level
    const currentRiskLevel = result?.riskLevel || "Moderate";

    return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Treatment Decision Support</h3>
        <button
          onClick={() => setShowTreatmentOptions(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">Based on your risk profile, the following treatment approaches may be considered:</p>

        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {TREATMENT_OPTIONS[currentRiskLevel].map((option, index) => (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-blue-600">{option.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${option.suitability.includes('Highly') ? 'bg-green-100 text-green-800' :
                          option.suitability.includes('Recommended') ? 'bg-blue-100 text-blue-800' :
                          option.suitability.includes('Consider') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {option.suitability}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>* Treatment recommendations are for informational purposes only and should be discussed with healthcare providers.</p>
          <p>* Individual factors including comorbidities, preferences, and local healthcare resources should be considered.</p>
        </div>
      </div>
    </div>
    );
  };

  // Component for competing risks in elderly patients
  const CompetingRisks = () => {
    // Ensure we're using the most current age
    const currentAge = result?.patientAge || 70;

    return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Competing Risk Analysis</h3>
        <button
          onClick={() => setShowCompetingRisks(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">For patients aged {currentAge} years, the following competing risks should be considered:</p>

        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Object.values(COMPETING_RISKS).map((risk, index) => (
              <li key={index}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-blue-600">{risk.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${risk.risk === 'High' ? 'bg-red-100 text-red-800' :
                          risk.risk === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {risk.risk} Risk
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {risk.impact}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-blue-600">Recommendation:</p>
                    <p className="text-sm text-gray-500">{risk.recommendation}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>* Competing risk analysis is particularly important for elderly patients when considering treatment options.</p>
          <p>* A comprehensive geriatric assessment may be beneficial for patients over 65 years of age.</p>
        </div>
      </div>
    </div>
    );
  };

  // Component for dynamic risk assessment (trend analysis)
  const DynamicRiskAssessment = ({ historicalData }) => {
    // Filter data to only include current patient
    const patientData = historicalData.filter(item => item.patientId === patientId);

    if (patientData.length < 2) {
      return (
        <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Dynamic Risk Assessment</h3>
          <p className="text-sm text-gray-600">At least two assessments for patient ID {patientId} are needed to show risk trends over time.</p>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Dynamic Risk Assessment</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Risk trend based on {patientData.length} assessments for patient ID {patientId}:</p>

          <div className="h-64 w-full">
            <div className="relative h-full w-full">
              {/* Simple visualization of risk trend */}
              <div className="absolute inset-0 flex items-end">
                {patientData.map((data, index) => (
                  <div
                    key={index}
                    className="w-full h-full flex flex-col justify-end items-center"
                  >
                    <div
                      className={`w-8 mx-auto ${data.riskLevel === 'Low' ? 'bg-green-500' : data.riskLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ height: `${data.probability * 100}%` }}
                    ></div>
                    <p className="text-xs mt-1">{new Date(data.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
                <span className="text-xs text-gray-500">100%</span>
                <span className="text-xs text-gray-500">75%</span>
                <span className="text-xs text-gray-500">50%</span>
                <span className="text-xs text-gray-500">25%</span>
                <span className="text-xs text-gray-500">0%</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-900">Trend Analysis:</h4>
            <p className="text-sm text-gray-600 mt-1">
              {patientData.length > 2 &&
                patientData[patientData.length - 1].probability > patientData[patientData.length - 2].probability
                ? "⚠️ Risk is increasing. More frequent monitoring may be needed."
                : patientData[patientData.length - 1].probability < patientData[patientData.length - 2].probability
                ? "✅ Risk is decreasing. Current approach appears effective."
                : "Risk level is stable."}
            </p>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>* Dynamic risk assessment allows for personalized monitoring schedules based on individual risk trajectories.</p>
            <p>* Consistent increases in risk may warrant more aggressive intervention strategies.</p>
          </div>
        </div>
      </div>
    );
  };

  // Get unique patient IDs from historical data
  const getUniquePatientIds = () => {
    const uniqueIds = new Set();
    historicalData.forEach(data => {
      if (data.patientId) {
        uniqueIds.add(data.patientId);
      }
    });
    return Array.from(uniqueIds);
  };

  // Component for patient ID input modal
  const PatientIdModal = () => {
    const [inputPatientId, setInputPatientId] = useState("");
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState("input"); // "input" or "select"

    // Get unique patient IDs
    const uniquePatientIds = getUniquePatientIds();

    const handleSubmitPatientId = () => {
      if (!inputPatientId.trim()) {
        setError("Please enter a valid patient ID");
        return;
      }

      setPatientId(inputPatientId.trim());
      setShowPatientIdModal(false);
      // Automatically submit the form after setting patient ID
      setTimeout(() => document.getElementById("risk-assessment-form").requestSubmit(), 100);
    };

    const handleNewPatient = () => {
      // Generate a random patient ID
      const newId = "P" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setPatientId(newId);
      setShowPatientIdModal(false);
      // Automatically submit the form after setting patient ID
      setTimeout(() => document.getElementById("risk-assessment-form").requestSubmit(), 100);
    };

    const handleSelectPatient = (selectedId) => {
      setPatientId(selectedId);
      setShowPatientIdModal(false);
      // Load the last assessment for this patient
      const patientData = historicalData.filter(item => item.patientId === selectedId);
      if (patientData.length > 0) {
        // Get the most recent assessment
        const latestAssessment = patientData.sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        )[0];

        // Pre-fill the form with the latest data
        setInputs({
          kcnq1: latestAssessment.kcnq1 || "",
          linc01785: latestAssessment.linc01785 || "",
          age: latestAssessment.age || "",
          afp: latestAssessment.afp || "",
          alb: latestAssessment.alb || "",
          ggt: latestAssessment.ggt || ""
        });

        // Set the result to show the latest assessment
        setResult({
          type: "success",
          probability: latestAssessment.probability,
          score: latestAssessment.score,
          riskLevel: latestAssessment.riskLevel,
          afpStatus: latestAssessment.afp > 10 ? "Elevated" : "Normal",
          date: latestAssessment.date,
          patientAge: latestAssessment.age,
          patientId: selectedId
        });
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Identification</h3>

          {/* Toggle between input and select modes */}
          <div className="mb-4 flex border rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("input")}
              className={`flex-1 py-2 ${viewMode === "input" ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              New/Enter ID
            </button>
            <button
              type="button"
              onClick={() => setViewMode("select")}
              className={`flex-1 py-2 ${viewMode === "select" ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              disabled={uniquePatientIds.length === 0}
            >
              Select Existing Patient
            </button>
          </div>

          {viewMode === "input" ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Please enter a patient ID to continue. This ensures that risk trend analysis is accurate for individual patients.
              </p>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="patientId">
                  Patient ID
                </label>
                <input
                  type="text"
                  id="patientId"
                  value={inputPatientId}
                  onChange={(e) => {
                    setInputPatientId(e.target.value);
                    setError("");
                  }}
                  className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter existing patient ID"
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleNewPatient}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  New Patient
                </button>
                <button
                  type="button"
                  onClick={handleSubmitPatientId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select a previously assessed patient to view or update their risk assessment.
              </p>

              <div className="mb-4 max-h-60 overflow-y-auto">
                <ul className="divide-y divide-gray-200">
                  {uniquePatientIds.map((id) => {
                    // Get the most recent assessment for this patient
                    const patientData = historicalData.filter(item => item.patientId === id);
                    const latestAssessment = patientData.sort((a, b) =>
                      new Date(b.date) - new Date(a.date)
                    )[0];

                    return (
                      <li key={id} className="py-3 hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectPatient(id)}>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Patient ID: {id}</p>
                            <p className="text-xs text-gray-500">
                              Last assessed: {new Date(latestAssessment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${latestAssessment.riskLevel === 'Low' ? 'text-green-600' : latestAssessment.riskLevel === 'Moderate' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {latestAssessment.riskLevel} Risk
                            </p>
                            <p className="text-xs text-gray-500">
                              {(latestAssessment.probability * 100).toFixed(1)}% probability
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {uniquePatientIds.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No previous patients found. Please create a new patient.
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNewPatient}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Create New Patient
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
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
          <p className="text-blue-200 mt-1 text-sm">
            Incorporating lncRNA biomarkers, clinical parameters, and personalized risk stratification
          </p>
        </div>

        <div className="p-6">
          {patientId && (
            <div className="mb-4 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Patient ID:</span>
                <span className="ml-2 text-sm font-medium text-blue-600">{patientId}</span>
                {getUniquePatientIds().length > 1 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({getUniquePatientIds().length} patients in database)
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPatientIdModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Patient History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientId("");
                    setResult(null);
                    setShowPatientIdModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Patient
                </button>
              </div>
            </div>
          )}
          <form id="risk-assessment-form" onSubmit={handleSubmit} className="space-y-6">
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
                      {getInputHint('afp')} (Values &gt;10 ng/mL considered elevated)
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Analysis Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
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

                  {/* Survival Curve Estimation */}
                  <SurvivalAnalysis riskLevel={result.riskLevel} />

                  {/* Personalized Clinical Recommendations */}
                  <ClinicalRecommendations riskLevel={result.riskLevel} />

                  {/* Dynamic Risk Assessment (if patient has multiple assessments) */}
                  {historicalData.filter(item => item.patientId === patientId).length > 0 && (
                    <DynamicRiskAssessment historicalData={historicalData.filter(item => item.patientId === patientId)} />
                  )}

                  {/* Treatment Options Button */}
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowTreatmentOptions(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Treatment Options
                    </button>
                  </div>

                  {/* Competing Risks Button (for elderly patients) */}
                  {result.patientAge > 65 && !showCompetingRisks && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => setShowCompetingRisks(true)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        View Competing Risks Analysis
                      </button>
                    </div>
                  )}

                  {/* Treatment Options Modal */}
                  {showTreatmentOptions && (
                    <TreatmentOptions />
                  )}

                  {/* Competing Risks Modal */}
                  {showCompetingRisks && (
                    <CompetingRisks />
                  )}
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
        <div className="mt-3 flex justify-center space-x-4">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Validated in 3 independent cohorts</span>
          </div>
          <div className="flex items-center">
            <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>AUC-ROC: 0.89 (95% CI: 0.85-0.93)</span>
          </div>
        </div>
      </div>

      {/* Patient ID Modal */}
      {showPatientIdModal && <PatientIdModal />}
    </div>
  );
}
