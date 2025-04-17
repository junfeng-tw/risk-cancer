/**
 * Simple test script for batch prediction functionality
 * 
 * This script can be used to test the batch prediction functionality
 * without needing to integrate it into the UI yet.
 * 
 * Usage:
 * 1. Open the browser console
 * 2. Run the test functions below
 */

import predictionService from '../services/predictionService';

/**
 * Test form input mode batch prediction
 */
export async function testBatchPredictionFromForm() {
  console.log('Testing batch prediction from form inputs...');
  
  // Sample batch inputs
  const batchInputs = [
    { sampleId: 'sample1', kcnq1: '2.5', linc01785: '3.1', age: '55', afp: '4224', alb: '37.6', ggt: '108.3' },
    { sampleId: 'sample2', kcnq1: '1.8', linc01785: '2.3', age: '65', afp: '3000', alb: '40.2', ggt: '90.5' },
    { sampleId: 'sample3', kcnq1: '3.2', linc01785: '3.8', age: '45', afp: '5000', alb: '35.1', ggt: '120.7' }
  ];
  
  try {
    const result = await predictionService.predictBatchFromForm(batchInputs);
    console.log('Batch prediction result:', result);
    
    if (result.type === 'success') {
      console.log('CSV content:');
      console.log(result.csvContent);
      
      // Uncomment to test download
      // predictionService.downloadResults(result.results, 'test_form_results.csv');
    }
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { type: 'error', message: error.message };
  }
}

/**
 * Test score input mode batch prediction
 */
export async function testBatchPredictionFromScore() {
  console.log('Testing batch prediction from score inputs...');
  
  // Sample batch inputs
  const batchInputs = [
    { sampleId: 'sample1', score: '2.5', age: '55', afp: '4224', alb: '37.6', ggt: '108.3' },
    { sampleId: 'sample2', score: '1.8', age: '65', afp: '3000', alb: '40.2', ggt: '90.5' },
    { sampleId: 'sample3', score: '3.2', age: '45', afp: '5000', alb: '35.1', ggt: '120.7' }
  ];
  
  try {
    const result = await predictionService.predictBatchFromScore(batchInputs);
    console.log('Batch prediction result:', result);
    
    if (result.type === 'success') {
      console.log('CSV content:');
      console.log(result.csvContent);
      
      // Uncomment to test download
      // predictionService.downloadResults(result.results, 'test_score_results.csv');
    }
    
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { type: 'error', message: error.message };
  }
}

/**
 * Test CSV parsing and prediction
 */
export async function testPredictionFromCSV() {
  console.log('Testing prediction from CSV content...');
  
  // Sample CSV content for form input mode
  const formCsvContent = `sampleId,kcnq1,linc01785,age,afp,alb,ggt
sample1,2.5,3.1,55,4224,37.6,108.3
sample2,1.8,2.3,65,3000,40.2,90.5
sample3,3.2,3.8,45,5000,35.1,120.7`;
  
  // Sample CSV content for score input mode
  const scoreCsvContent = `sampleId,score,age,afp,alb,ggt
sample1,2.5,55,4224,37.6,108.3
sample2,1.8,65,3000,40.2,90.5
sample3,3.2,45,5000,35.1,120.7`;
  
  try {
    console.log('Testing form input mode...');
    const formResult = await predictionService.predictFromCSV(formCsvContent, 'form');
    console.log('Form CSV prediction result:', formResult);
    
    console.log('Testing score input mode...');
    const scoreResult = await predictionService.predictFromCSV(scoreCsvContent, 'score');
    console.log('Score CSV prediction result:', scoreResult);
    
    return { formResult, scoreResult };
  } catch (error) {
    console.error('Test failed:', error);
    return { type: 'error', message: error.message };
  }
}

/**
 * Test template generation
 */
export function testTemplateGeneration() {
  console.log('Testing template generation...');
  
  const formTemplate = predictionService.getFormInputTemplate();
  console.log('Form input template:');
  console.log(formTemplate);
  
  const scoreTemplate = predictionService.getScoreInputTemplate();
  console.log('Score input template:');
  console.log(scoreTemplate);
  
  // Uncomment to test download
  // predictionService.downloadTemplate('form');
  // predictionService.downloadTemplate('score');
  
  return { formTemplate, scoreTemplate };
}

// Export all test functions
export default {
  testBatchPredictionFromForm,
  testBatchPredictionFromScore,
  testPredictionFromCSV,
  testTemplateGeneration
};
