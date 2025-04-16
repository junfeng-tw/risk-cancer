import predict from '../predict';
import { calculateScore, getRiskLevel, getAfpStatus } from '../utils/formUtils';

/**
 * Service for handling prediction logic
 */
export default {
  /**
   * Process form inputs and generate prediction
   * @param {Object} inputs - Form input values
   * @returns {Promise<Object>} - Prediction result
   */
  async predictRisk(inputs) {
    try {
      // Convert inputs to numbers
      const values = Object.values(inputs).map(parseFloat);
      const [kcnq1, linc01785, age, afp, alb, ggt] = values;
      
      // Calculate lncRNA score
      const score = calculateScore(kcnq1, linc01785);
      
      // Get prediction from model
      const probability = await predict([score, age, afp, alb, ggt]);
      
      // Determine risk level and AFP status
      const riskLevel = getRiskLevel(probability);
      const afpStatus = getAfpStatus(afp);
      
      return {
        type: "success",
        probability,
        score,
        riskLevel,
        afpStatus
      };
    } catch (error) {
      console.error("Prediction error:", error);
      return {
        type: "error",
        message: "An error occurred during prediction. Please try again."
      };
    }
  },
  
  /**
   * Simulate prediction for testing or when model is not available
   * @param {Object} inputs - Form input values
   * @returns {Promise<Object>} - Simulated prediction result
   */
  async simulatePrediction(inputs) {
    // Convert inputs to numbers
    const values = Object.values(inputs).map(parseFloat);
    const [kcnq1, linc01785, age, afp, alb, ggt] = values;
    
    // Calculate lncRNA score
    const score = calculateScore(kcnq1, linc01785);
    
    // Simulate ML processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a probability based on inputs (for simulation only)
    const probability = Math.min(0.95, Math.max(0.05, 
      (score + 3.5) / 7 * 0.5 + 
      (age > 60 ? 0.2 : 0) + 
      (afp > 20 ? 0.2 : 0) + 
      (alb < 35 ? 0.1 : 0) + 
      (ggt > 60 ? 0.1 : 0)
    ));
    
    // Determine risk level and AFP status
    const riskLevel = getRiskLevel(probability);
    const afpStatus = getAfpStatus(afp);
    
    return {
      type: "success",
      probability,
      score,
      riskLevel,
      afpStatus
    };
  }
};
