import { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { fetchWithProgress } from '../utils/modelLoader';

// Create context
const ModelLoadingContext = createContext({
  isLoading: true,
  progress: 0,
  isLoaded: false,
  error: null,
  stage: 'initializing', // 'downloading', 'processing', 'initializing'
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
    stage: 'initializing',
  });
  
  // Refs for tracking progress simulation
  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const hasRealProgressRef = useRef(false);

  // Function to simulate progress
  const simulateProgress = () => {
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - startTimeRef.current) / 1000;
    
    // If we've received real progress updates, don't override with simulation
    if (hasRealProgressRef.current) return;
    
    // Simulate an S-curve for progress: slow start, faster middle, slow end
    let simulatedProgress;
    
    // First 2 seconds: 0-20%
    if (elapsedSeconds < 2) {
      simulatedProgress = (elapsedSeconds / 2) * 20;
    }
    // 2-5 seconds: 20-70% (faster progress in the middle)
    else if (elapsedSeconds < 5) {
      simulatedProgress = 20 + ((elapsedSeconds - 2) / 3) * 50;
    }
    // 5-15 seconds: 70-95% (slower towards the end)
    else if (elapsedSeconds < 15) {
      simulatedProgress = 70 + ((elapsedSeconds - 5) / 10) * 25;
    }
    // After 15 seconds: cap at 95% until real completion
    else {
      simulatedProgress = 95;
    }
    
    // Update state with simulated progress
    setState(prev => ({
      ...prev,
      progress: Math.min(95, Math.round(simulatedProgress)), // Cap at 95%
    }));
  };

  useEffect(() => {
    // Start progress simulation as a fallback
    startTimeRef.current = Date.now();
    progressIntervalRef.current = setInterval(simulateProgress, 100);

    // Configure ONNX Runtime
    const options = {
      executionProviders: ['wasm'],
      logSeverityLevel: 0,
    };

    ort.env.numThreads = 1;
    ort.env.wasm.simd = true;
    ort.env.wasm.proxy = false;

    // First, update state to show we're starting to download
    setState(prev => ({
      ...prev,
      stage: 'downloading',
      progress: 0,
    }));

    // Step 1: Download the model file with progress tracking
    const modelUrl = './HistGradientBoosting.onnx';
    
    // Try to fetch the model with progress tracking
    fetchWithProgress(modelUrl, (downloadProgress) => {
      hasRealProgressRef.current = true; // We have real progress now
      
      // Update state with download progress (scale to 0-80%)
      setState(prev => ({
        ...prev,
        progress: Math.min(80, Math.round(downloadProgress * 0.8)),
        stage: 'downloading',
      }));
    })
    .then(modelData => {
      // Update state to show we're processing the model
      setState(prev => ({
        ...prev,
        progress: 85,
        stage: 'processing',
      }));
      
      // Step 2: Create the ONNX session with the downloaded model data
      return ort.InferenceSession.create(
        modelData,
        options,
        (progress) => {
          // If we get progress updates from ONNX, use them
          if (progress > 0) {
            // Scale progress from 85-95%
            const scaledProgress = 85 + Math.min(10, progress * 0.1);
            setState(prev => ({
              ...prev,
              progress: Math.round(scaledProgress),
              stage: 'initializing',
            }));
          }
        }
      );
    })
    .then(session => {
      console.log("Model loaded successfully");
      console.log("Model input names:", session.inputNames);
      console.log("Model output names:", session.outputNames);
      
      // Clear the simulation interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Store the session in window for global access
      window.onnxSession = session;
      
      // Set final state
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        progress: 100,
        stage: 'ready',
      }));
    })
    .catch(error => {
      console.error("Failed to load model:", error);
      
      // Clear the simulation interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to load model",
      }));
    });

    // Cleanup function
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <ModelLoadingContext.Provider value={state}>
      {children}
    </ModelLoadingContext.Provider>
  );
}
