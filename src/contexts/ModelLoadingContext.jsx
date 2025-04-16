import { createContext, useState, useContext, useEffect } from 'react';
import * as ort from 'onnxruntime-web';

// Create context
const ModelLoadingContext = createContext({
  isLoading: true,
  progress: 0,
  isLoaded: false,
  error: null,
});

// Custom hook to use the context
export const useModelLoading = () => useContext(ModelLoadingContext);

// Provider component
export function ModelLoadingProvider({ children }) {
  const [state, setState] = useState({
    isLoading: true,
    progress: 0,
    isLoaded: false,
    error: null,
  });

  useEffect(() => {
    // Configure ONNX Runtime to report progress
    const options = {
      executionProviders: ['wasm'],
      logSeverityLevel: 0,
    };

    // Create a session with progress tracking
    let lastProgress = 0;
    
    const session = ort.InferenceSession.create(
      "./HistGradientBoosting.onnx", 
      options,
      (progress) => {
        // Only update if progress has changed significantly (at least 1%)
        if (progress - lastProgress >= 1 || progress === 100) {
          lastProgress = progress;
          setState(prev => ({
            ...prev,
            progress,
            isLoading: progress < 100,
            isLoaded: progress === 100,
          }));
        }
      }
    );

    // Handle session creation result
    session
      .then((session) => {
        console.log("Model loaded successfully");
        console.log("Model input names:", session.inputNames);
        console.log("Model output names:", session.outputNames);
        
        // Store the session in window for global access
        window.onnxSession = session;
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          isLoaded: true,
          progress: 100,
        }));
      })
      .catch((error) => {
        console.error("Failed to load model:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to load model",
        }));
      });

    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, []);

  return (
    <ModelLoadingContext.Provider value={state}>
      {children}
    </ModelLoadingContext.Provider>
  );
}
