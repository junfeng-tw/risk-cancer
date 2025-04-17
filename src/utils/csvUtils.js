/**
 * Utilities for CSV operations
 */

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} data - Array of objects to convert
 * @returns {string} - CSV string
 */
export const objectsToCSV = (data) => {
  if (!data || !data.length) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Create and trigger download of a CSV file
 * @param {string} csvContent - CSV content
 * @param {string} fileName - File name
 */
export const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a template for form input mode
 * @returns {string} - CSV content
 */
export const generateFormInputTemplate = () => {
  const headers = ['sampleId', 'kcnq1', 'linc01785', 'age', 'afp', 'alb', 'ggt'];
  const exampleRow = ['sample1', '2.5', '3.1', '55', '4224', '37.6', '108.3'];
  const emptyRow = ['sample2', '', '', '60', '', '40', ''];
  const comment = ['# Note: Empty values will be automatically filled with values typical of healthy individuals. These fields will be marked in the results.'];

  return comment.join(',') + '\n' +
         headers.join(',') + '\n' +
         exampleRow.join(',') + '\n' +
         emptyRow.join(',');
};

/**
 * Generate a template for score input mode
 * @returns {string} - CSV content
 */
export const generateScoreInputTemplate = () => {
  const headers = ['sampleId', 'score', 'age', 'afp', 'alb', 'ggt'];
  const exampleRow = ['sample1', '2.5', '55', '4224', '37.6', '108.3'];
  const emptyRow = ['sample2', '', '60', '', '40', ''];
  const comment = ['# Note: Empty values will be automatically filled with values typical of healthy individuals. These fields will be marked in the results.'];

  return comment.join(',') + '\n' +
         headers.join(',') + '\n' +
         exampleRow.join(',') + '\n' +
         emptyRow.join(',');
};

/**
 * Parse CSV content to array of objects
 * @param {string} csvContent - CSV content
 * @returns {Array<Object>} - Array of objects
 */
export const parseCSV = (csvContent) => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    result.push(obj);
  }

  return result;
};

/**
 * Parse a CSV line, handling quoted values
 * @param {string} line - CSV line
 * @returns {Array<string>} - Array of values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes (two double quotes in a row)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
}
