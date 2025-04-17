/**
 * Run this file to test the batch prediction functionality
 * 
 * Usage:
 * 1. Import this file in the browser console
 * 2. Call the runTests function
 */

import batchPredictionTest from './batchPredictionTest';

/**
 * Run all batch prediction tests
 */
export async function runTests() {
  console.log('=== Running Batch Prediction Tests ===');
  
  console.log('\n1. Testing template generation:');
  const templateResult = batchPredictionTest.testTemplateGeneration();
  console.log('Template generation test completed.');
  
  console.log('\n2. Testing batch prediction from form inputs:');
  const formResult = await batchPredictionTest.testBatchPredictionFromForm();
  console.log('Form batch prediction test completed.');
  
  console.log('\n3. Testing batch prediction from score inputs:');
  const scoreResult = await batchPredictionTest.testBatchPredictionFromScore();
  console.log('Score batch prediction test completed.');
  
  console.log('\n4. Testing prediction from CSV content:');
  const csvResult = await batchPredictionTest.testPredictionFromCSV();
  console.log('CSV prediction test completed.');
  
  console.log('\n=== All Tests Completed ===');
  return {
    templateResult,
    formResult,
    scoreResult,
    csvResult
  };
}

export default runTests;
