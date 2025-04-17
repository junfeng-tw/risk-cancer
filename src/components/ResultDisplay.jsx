/**
 * Component to display prediction results
 */
export default function ResultDisplay({ result }) {
  if (!result) return null;

  if (result.type === 'error') {
    return (
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-red-50">
        <p className="text-sm sm:text-base text-red-700">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-md">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center mb-2 pb-2 border-b border-blue-200">
          <div className="mr-2 p-1 sm:p-1.5 rounded-md bg-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Analysis Results</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ResultCard
            label="Risk Probability"
            value={`${(result.probability * 100).toFixed(1)}%`}
            color="text-blue-600"
          />
          <ResultCard
            label="Risk Level"
            value={result.riskLevel}
            color={getRiskLevelColor(result.riskLevel)}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Card component for displaying individual result values
 */
function ResultCard({ label, value, color }) {
  return (
    <div className="p-3 sm:p-4 md:p-5 bg-white rounded-lg shadow-md border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:border-indigo-200">
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Helper function to get color based on risk level
 */
function getRiskLevelColor(riskLevel) {
  switch (riskLevel) {
    case 'Low':
      return 'text-green-600';
    case 'Moderate':
      return 'text-yellow-600';
    case 'High':
      return 'text-red-600';
    default:
      return 'text-blue-600';
  }
}
