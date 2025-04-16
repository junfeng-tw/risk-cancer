import predict from '../predict';
import { calculateScore, getRiskLevel } from '../utils/formUtils';

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
      const probability = await window.onnxPredict([score, age, afp, alb, ggt]);
      
      // Determine risk level and AFP status
      const riskLevel = getRiskLevel(probability);
      
      return {
        type: "success",
        probability,
        riskLevel
      };
    } catch (error) {
      console.error("Prediction error:", error);
      return {
        type: "error",
        message: "An error occurred during prediction. Please try again."
      };
    }
  }
};
