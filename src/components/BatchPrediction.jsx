import { useState, useRef } from 'react';
import predictionService from '../services/predictionService';
import LoadingButton from './LoadingButton';

/**
 * Batch Prediction Component
 * Allows users to upload CSV files for batch prediction and download templates
 */
export default function BatchPrediction() {
  const [mode, setMode] = useState('form');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle mode change
  const handleModeChange = (e) => {
    setMode(e.target.value);
    setFile(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  // Handle template download
  const handleDownloadTemplate = () => {
    predictionService.downloadTemplate(mode);
  };

  // Handle file upload and prediction
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Read file content
      const reader = new FileReader();

      reader.onload = async (event) => {
        const csvContent = event.target.result;

        // Process CSV content
        const result = await predictionService.predictFromCSV(csvContent, mode);

        if (result.type === 'success') {
          setResults(result);
        } else {
          setError(result.message);
        }

        setIsProcessing(false);
      };

      reader.onerror = () => {
        setError('Error reading the file');
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (error) {
      setError('An error occurred: ' + error.message);
      setIsProcessing(false);
    }
  };

  // Handle results download
  const handleDownloadResults = () => {
    if (results && results.results) {
      predictionService.downloadResults(results.results);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Batch Prediction</h2>

      <div className="mb-4 sm:mb-6">
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
          Prediction Mode
        </label>
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="predictionMode"
              value="form"
              checked={mode === 'form'}
              onChange={handleModeChange}
            />
            <span className="ml-2 text-sm">Form Input Mode</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-600"
              name="predictionMode"
              value="score"
              checked={mode === 'score'}
              onChange={handleModeChange}
            />
            <span className="ml-2 text-sm">Score Input Mode</span>
          </label>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {mode === 'form'
            ? 'Upload CSV with sampleId, kcnq1, linc01785, age, afp, alb, ggt columns'
            : 'Upload CSV with sampleId, score, age, afp, alb, ggt columns'}
        </p>
      </div>

      <div className="mb-4 sm:mb-6">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-300 text-xs sm:text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Download Template
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-xs sm:text-sm text-gray-500
              file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4
              file:rounded-md file:border-0
              file:text-xs sm:file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
              Selected file: {file.name}
            </p>
          )}
          {error && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <LoadingButton loading={isProcessing} />
        </div>
      </form>

      {results && results.type === 'success' && (
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Prediction Results</h3>
            <button
              type="button"
              onClick={handleDownloadResults}
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-green-300 text-xs sm:text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Results
            </button>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="flex justify-between mb-2">
              <div className="text-xs sm:text-sm font-medium text-gray-700">Input Data</div>
              <div className="text-xs sm:text-sm font-medium text-blue-700">Prediction Results</div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Original Input Fields */}
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample ID
                  </th>
                  {mode === 'form' && (
                    <>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KCNQ1-AS1
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LINC01785
                      </th>
                    </>
                  )}
                  {mode === 'score' && (
                    <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                  )}
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AFP
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ALB
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    γ-GT
                  </th>

                  {/* Divider */}
                  <th scope="col" className="px-1 py-2 sm:py-3 bg-gray-200"></th>

                  {/* Prediction Results */}
                  {mode === 'form' && (
                    <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                      Score
                    </th>
                  )}
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Probability
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Risk Level
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Prediction (0/1)
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                    Imputed Fields
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.results.map((result, index) => (
                  <tr key={index}>
                    {/* Original Input Fields */}
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {result.sampleId}
                    </td>
                    {mode === 'form' && (
                      <>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {result.kcnq1.toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {result.linc01785.toFixed(2)}
                        </td>
                      </>
                    )}
                    {mode === 'score' && (
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {result.score.toFixed(2)}
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {result.age.toFixed(0)}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {result.afp.toFixed(1)}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {result.alb.toFixed(1)}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {result.ggt.toFixed(1)}
                    </td>

                    {/* Divider */}
                    <td className="px-1 py-2 sm:py-4 bg-gray-200"></td>

                    {/* Prediction Results */}
                    {mode === 'form' && (
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 bg-blue-50">
                        {result.score.toFixed(3)}
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 bg-blue-50">
                      {(result.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm bg-blue-50">
                      <span className={`px-1.5 sm:px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${result.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                          result.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                        {result.riskLevel}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium bg-blue-50">
                      <span className={`px-2 py-1 rounded ${result.prediction === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {result.prediction}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 bg-blue-50">
                      {result.imputedFields ? (
                        <span className="text-amber-600">{result.imputedFields}</span>
                      ) : (
                        <span className="text-green-600">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 sm:mt-4 space-y-2">
            <p className="text-xs sm:text-sm text-gray-500">
              Total samples processed: {results.results.length}
            </p>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">Missing Value Handling:</p>
              <p className="text-xs text-blue-700 mt-1">
                The system automatically processes empty or invalid values in the CSV by filling them with values typical of healthy individuals. This approach is based on the clinical observation that missing tests often indicate healthier patients. Missing fields are marked in the "Imputed Fields" column.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-medium text-blue-800">Biomarker Default Values:</p>
                  <ul className="text-blue-700 list-disc pl-4 space-y-0.5">
                    <li>KCNQ1-AS1: 1.0 (healthy range)</li>
                    <li>LINC01785: 1.5 (healthy range)</li>
                    <li>Score: 0.8 (healthy range)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Clinical Parameter Defaults:</p>
                  <ul className="text-blue-700 list-disc pl-4 space-y-0.5">
                    <li>Age: 45 years (younger)</li>
                    <li>AFP: 5 ng/mL (healthy level)</li>
                    <li>Albumin: 45 g/L (optimal level)</li>
                    <li>γ-GT: 20 U/L (healthy level)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
