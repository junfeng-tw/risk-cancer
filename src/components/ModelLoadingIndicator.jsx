import { useModelLoading } from '../contexts/ModelLoadingContext';
import { useState, useEffect } from 'react';

/**
 * Component to display model loading progress
 */
export default function ModelLoadingIndicator() {
  const { isLoading, progress, isLoaded, error } = useModelLoading();
  const [showTip, setShowTip] = useState(false);

  // Show a tip after 8 seconds if still loading
  useEffect(() => {
    let tipTimer;
    if (isLoading && progress < 90) {
      tipTimer = setTimeout(() => setShowTip(true), 8000);
    }
    return () => clearTimeout(tipTimer);
  }, [isLoading, progress]);

  // If model is loaded or there's an error, don't show anything
  if (isLoaded || (!isLoading && !error)) {
    return null;
  }

  // Get appropriate loading message based on progress
  const getLoadingMessage = () => {
    if (progress < 30) return 'Downloading WASM model...';
    if (progress < 70) return 'Processing model files...';
    if (progress < 95) return 'Initializing prediction engine...';
    return 'Almost ready...';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs w-full border border-blue-100 z-50 transition-all duration-500 ease-in-out">
      <div className="flex items-center mb-2">
        {error ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          <div className="relative mr-3">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
        )}
        <span className="font-medium text-gray-800">
          {error ? 'Error loading model' : 'Loading prediction model'}
        </span>
      </div>

      {!error && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {getLoadingMessage()}
            </p>
            <p className="text-xs font-medium text-blue-600">
              {progress}%
            </p>
          </div>

          {/* Show tip for slow connections */}
          {showTip && (
            <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
              <p>First time loading may take longer on mobile devices. The model will be cached for faster loading next time.</p>
            </div>
          )}
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
