/**
 * Component to display prediction results
 */
export default function ResultDisplay({ result }) {
  if (!result) return null;

  if (result.type === 'error') {
    return (
      <div className="mt-6 p-4 rounded-lg bg-red-50">
        <p className="text-red-700">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 rounded-lg bg-blue-50">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Analysis Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    <div className="p-4 bg-white rounded-lg shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
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
