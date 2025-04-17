/**
 * Header component for the application
 */
export default function Header() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">Hepatocellular Carcinoma Risk Assessment System</h1>
        <p className="text-blue-100 text-xs sm:text-sm mt-1 font-medium">POWERED BY <span className="text-yellow-400">AEGA-EV</span><sup>™</sup> BIOMARKER TECHNOLOGY</p>
      </div>
      <div className="bg-blue-900/40 px-3 py-1 rounded-md border border-blue-400/30 self-start sm:self-center">
        <p className="text-xs text-blue-200 font-mono whitespace-nowrap">ML.HistGBoost</p>
      </div>
    </div>
  );
}
