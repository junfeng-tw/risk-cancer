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
      // 使用偏向健康人群的默认值，因为空值通常意味着患者较为健康，某些检查没有进行
      const NORMAL_VALUES = {
        kcnq1: 1.0,      // 偏向健康人群的低值
        linc01785: 1.5, // 偏向健康人群的低值
        age: 45,        // 偏年轻人群
        afp: 5,         // 健康人群AFP值（通常<10 ng/mL）
        alb: 45,        // 健康人群白蛋白值（偏高，更健康）
        ggt: 20         // 健康人群γ-GT值（偏低，更健康）
      };

      for (const input of batchInputs) {
        const { sampleId, kcnq1, linc01785, age, afp, alb, ggt } = input;
        const imputedFields = [];

        // Convert string values to numbers with empty value handling
        let numKcnq1 = parseFloat(kcnq1);
        let numLinc01785 = parseFloat(linc01785);
        let numAge = parseFloat(age);
        let numAfp = parseFloat(afp);
        let numAlb = parseFloat(alb);
        let numGgt = parseFloat(ggt);

        // Handle empty or invalid values with conservative imputation
        if (isNaN(numKcnq1)) {
          numKcnq1 = NORMAL_VALUES.kcnq1; // 使用保守值
          imputedFields.push('kcnq1');
        }

        if (isNaN(numLinc01785)) {
          numLinc01785 = NORMAL_VALUES.linc01785; // 使用保守值
          imputedFields.push('linc01785');
        }

        if (isNaN(numAge)) {
          numAge = NORMAL_VALUES.age; // 使用保守值
          imputedFields.push('age');
        }

        if (isNaN(numAfp)) {
          numAfp = NORMAL_VALUES.afp; // 使用保守值
          imputedFields.push('afp');
        }

        if (isNaN(numAlb)) {
          numAlb = NORMAL_VALUES.alb; // 使用保守值
          imputedFields.push('alb');
        }

        if (isNaN(numGgt)) {
          numGgt = NORMAL_VALUES.ggt; // 使用保守值
          imputedFields.push('ggt');
        }

        // Calculate lncRNA score
        const score = calculateScore(numKcnq1, numLinc01785);

        // Get prediction from model
        const probability = await predict([score, numAge, numAfp, numAlb, numGgt]);

        // Determine risk level
        const riskLevel = getRiskLevel(probability);

        // Keep all original input fields and add prediction results
        results.push({
          // Original input fields
          sampleId,
          kcnq1: numKcnq1,
          linc01785: numLinc01785,
          age: numAge,
          afp: numAfp,
          alb: numAlb,
          ggt: numGgt,
          // Prediction results
          score,
          probability,
          riskLevel,
          prediction: riskLevel === 'High' ? 1 : 0,  // Binary prediction (1 for High risk, 0 for Low/Moderate)
          imputedFields: imputedFields.length > 0 ? imputedFields.join(', ') : ''
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
      // 使用偏向健康人群的默认值，因为空值通常意味着患者较为健康，某些检查没有进行
      const NORMAL_VALUES = {
        score: 0.8,      // 偏向健康人群的低值
        age: 45,        // 偏年轻人群
        afp: 5,         // 健康人群AFP值（通常<10 ng/mL）
        alb: 45,        // 健康人群白蛋白值（偏高，更健康）
        ggt: 20         // 健康人群γ-GT值（偏低，更健康）
      };

      for (const input of batchInputs) {
        const { sampleId, score, age, afp, alb, ggt } = input;
        const imputedFields = [];

        // Convert string values to numbers with empty value handling
        let numScore = parseFloat(score);
        let numAge = parseFloat(age);
        let numAfp = parseFloat(afp);
        let numAlb = parseFloat(alb);
        let numGgt = parseFloat(ggt);

        // Handle empty or invalid values with conservative imputation
        if (isNaN(numScore)) {
          numScore = NORMAL_VALUES.score; // 使用保守值
          imputedFields.push('score');
        }

        if (isNaN(numAge)) {
          numAge = NORMAL_VALUES.age; // 使用保守值
          imputedFields.push('age');
        }

        if (isNaN(numAfp)) {
          numAfp = NORMAL_VALUES.afp; // 使用保守值
          imputedFields.push('afp');
        }

        if (isNaN(numAlb)) {
          numAlb = NORMAL_VALUES.alb; // 使用保守值
          imputedFields.push('alb');
        }

        if (isNaN(numGgt)) {
          numGgt = NORMAL_VALUES.ggt; // 使用保守值
          imputedFields.push('ggt');
        }

        // Get prediction from model
        const probability = await predict([numScore, numAge, numAfp, numAlb, numGgt]);

        // Determine risk level
        const riskLevel = getRiskLevel(probability);

        // Keep all original input fields and add prediction results
        results.push({
          // Original input fields
          sampleId,
          score: numScore,
          age: numAge,
          afp: numAfp,
          alb: numAlb,
          ggt: numGgt,
          // Prediction results
          probability,
          riskLevel,
          prediction: riskLevel === 'High' ? 1 : 0,  // Binary prediction (1 for High risk, 0 for Low/Moderate)
          imputedFields: imputedFields.length > 0 ? imputedFields.join(', ') : ''
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
