import predict from '../predict';
import { calculateScore, getRiskLevel } from '../utils/formUtils';
import { objectsToCSV, downloadCSV, generateFormInputTemplate, generateScoreInputTemplate, parseCSV } from '../utils/csvUtils';

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

      // Determine risk level
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
  },

  /**
   * Process batch predictions from form inputs (kcnq1, linc01785, age, afp, alb, ggt)
   * @param {Array<Object>} batchInputs - Array of input objects with sampleId and form values
   * @returns {Promise<Object>} - Batch prediction results
   */
  async predictBatchFromForm(batchInputs) {
    try {
      const results = [];

      for (const input of batchInputs) {
        const { sampleId, kcnq1, linc01785, age, afp, alb, ggt } = input;

        // Convert string values to numbers
        const numKcnq1 = parseFloat(kcnq1);
        const numLinc01785 = parseFloat(linc01785);
        const numAge = parseFloat(age);
        const numAfp = parseFloat(afp);
        const numAlb = parseFloat(alb);
        const numGgt = parseFloat(ggt);

        // Calculate lncRNA score
        const score = calculateScore(numKcnq1, numLinc01785);

        // Get prediction from model
        const probability = await predict([score, numAge, numAfp, numAlb, numGgt]);

        // Determine risk level
        const riskLevel = getRiskLevel(probability);

        results.push({
          sampleId,
          score,
          probability,
          riskLevel,
          prediction: riskLevel === 'High' ? 1 : 0
        });
      }

      // Generate CSV content
      const csvContent = objectsToCSV(results);

      return {
        type: "success",
        results,
        csvContent
      };
    } catch (error) {
      console.error("Batch prediction error:", error);
      return {
        type: "error",
        message: "An error occurred during batch prediction. Please check your input data and try again."
      };
    }
  },

  /**
   * Process batch predictions from score inputs (score, age, afp, alb, ggt)
   * @param {Array<Object>} batchInputs - Array of input objects with sampleId and score values
   * @returns {Promise<Object>} - Batch prediction results
   */
  async predictBatchFromScore(batchInputs) {
    try {
      const results = [];

      for (const input of batchInputs) {
        const { sampleId, score, age, afp, alb, ggt } = input;

        // Convert string values to numbers
        const numScore = parseFloat(score);
        const numAge = parseFloat(age);
        const numAfp = parseFloat(afp);
        const numAlb = parseFloat(alb);
        const numGgt = parseFloat(ggt);

        // Get prediction from model
        const probability = await predict([numScore, numAge, numAfp, numAlb, numGgt]);

        // Determine risk level
        const riskLevel = getRiskLevel(probability);

        results.push({
          sampleId,
          score: numScore,
          probability,
          riskLevel,
          prediction: riskLevel === 'High' ? 1 : 0
        });
      }

      // Generate CSV content
      const csvContent = objectsToCSV(results);

      return {
        type: "success",
        results,
        csvContent
      };
    } catch (error) {
      console.error("Batch prediction error:", error);
      return {
        type: "error",
        message: "An error occurred during batch prediction. Please check your input data and try again."
      };
    }
  },

  /**
   * Process CSV content for batch prediction
   * @param {string} csvContent - CSV content
   * @param {string} mode - 'form' or 'score'
   * @returns {Promise<Object>} - Batch prediction results
   */
  async predictFromCSV(csvContent, mode) {
    try {
      // Parse CSV content
      const inputs = parseCSV(csvContent);

      // Validate inputs
      if (!inputs || inputs.length === 0) {
        return {
          type: "error",
          message: "No valid data found in the CSV file."
        };
      }

      // Process based on mode
      if (mode === 'form') {
        return await this.predictBatchFromForm(inputs);
      } else if (mode === 'score') {
        return await this.predictBatchFromScore(inputs);
      } else {
        return {
          type: "error",
          message: "Invalid prediction mode specified."
        };
      }
    } catch (error) {
      console.error("CSV prediction error:", error);
      return {
        type: "error",
        message: "An error occurred while processing the CSV file. Please check the format and try again."
      };
    }
  },

  /**
   * Download prediction results as CSV
   * @param {Array<Object>} results - Prediction results
   * @param {string} fileName - File name (default: 'prediction_results.csv')
   */
  downloadResults(results, fileName = 'prediction_results.csv') {
    const csvContent = objectsToCSV(results);
    downloadCSV(csvContent, fileName);
  },

  /**
   * Get template CSV content for form input mode
   * @returns {string} - CSV content
   */
  getFormInputTemplate() {
    return generateFormInputTemplate();
  },

  /**
   * Get template CSV content for score input mode
   * @returns {string} - CSV content
   */
  getScoreInputTemplate() {
    return generateScoreInputTemplate();
  },

  /**
   * Download template CSV file
   * @param {string} mode - 'form' or 'score'
   */
  downloadTemplate(mode) {
    const fileName = mode === 'form' ? 'form_input_template.csv' : 'score_input_template.csv';
    const content = mode === 'form' ? this.getFormInputTemplate() : this.getScoreInputTemplate();
    downloadCSV(content, fileName);
  }
};
