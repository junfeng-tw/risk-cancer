/**
 * Button component with loading state
 */
export default function LoadingButton({ loading, onClick, type = "submit", className = "", disabled = false }) {
  // Determine if button should be disabled (either due to loading or explicit disabled prop)
  const isDisabled = loading || disabled;

  return (
    <div className="flex flex-col items-center">
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={`px-10 py-4 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg
          hover:from-blue-700 hover:to-blue-800 transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
          transform hover:scale-105 active:scale-95 min-w-[240px]
          ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : disabled ? (
          <span className="flex items-center justify-center">
            Loading Model...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            Calculate Risk Score
          </span>
        )}
      </button>
      <p className="mt-2 text-xs text-gray-500">
        {disabled ? "Please wait while the model loads..." : "Results will appear below"}
      </p>
    </div>
  );
}
