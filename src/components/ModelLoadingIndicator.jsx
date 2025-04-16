import { useModelLoading } from '../contexts/ModelLoadingContext';

/**
 * Component to display model loading progress
 */
export default function ModelLoadingIndicator() {
  const { isLoading, progress, isLoaded, error } = useModelLoading();

  // If model is loaded or there's an error, don't show anything
  if (isLoaded || (!isLoading && !error)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs w-full border border-blue-100 z-50">
      <div className="flex items-center mb-2">
        {error ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <span className="font-medium text-gray-800">
          {error ? 'Error loading model' : 'Loading prediction model...'}
        </span>
      </div>
      
      {!error && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress < 100 
              ? `Loading WASM model: ${progress}%` 
              : 'Initializing model...'}
          </p>
        </>
      )}
      
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error}. Please refresh the page to try again.
        </p>
      )}
    </div>
  );
}
