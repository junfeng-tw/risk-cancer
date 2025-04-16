/**
 * Header component for the application
 */
export default function Header() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Hepatocellular Carcinoma Risk  Assessment System</h1>
        <p className="text-blue-100 text-sm mt-1 font-medium">POWERED BY  <span className="text-yellow-400">AEGA-EV</span><sup>™</sup> BIOMARKER TECHNOLOGY</p>
      </div>
      <div className="bg-blue-900/40 px-3 py-1 rounded-md border border-blue-400/30">
        <p className="text-xs text-blue-200 font-mono">ML.HistGBoost</p>
      </div>
    </div>
  );
}
