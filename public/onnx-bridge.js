/**
 * ONNX Bridge - Connects the ONNX model with the browser
 * This file is loaded in index.html and provides a global function
 * for the React application to call the ONNX model.
 */

// Global function to predict using the ONNX model
window.onnxPredict = async function(input) {
  try {
    // If the predict module is loaded from the React app
    if (typeof predict === 'function') {
      return await predict(input);
    } else {
      console.warn('ONNX prediction function not available, using fallback simulation');
      
      // Fallback simulation for testing without the model
      // This simulates a 1.5 second delay and returns a probability
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple simulation based on input values
      const [score, age, afp, alb, ggt] = input;
      let probability = 0.5; // Base probability
      
      // Adjust based on score (higher score = higher risk)
      if (score > 0) probability += score / 10;
      else probability -= Math.abs(score) / 10;
      
      // Adjust based on age (older = higher risk)
      if (age > 60) probability += 0.1;
      
      // Adjust based on AFP (higher = higher risk)
      if (afp > 20) probability += 0.15;
      
      // Adjust based on albumin (lower = higher risk)
      if (alb < 35) probability += 0.1;
      
      // Adjust based on GGT (higher = higher risk)
      if (ggt > 60) probability += 0.1;
      
      // Ensure probability is between 0 and 1
      probability = Math.min(0.95, Math.max(0.05, probability));
      
      return probability;
    }
  } catch (error) {
    console.error('Error in ONNX prediction:', error);
    // Return a default value in case of error
    return 0.5;
  }
};
