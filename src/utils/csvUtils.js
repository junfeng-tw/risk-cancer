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
 * Compatible with desktop and mobile browsers including iOS
 * @param {string} csvContent - CSV content
 * @param {string} fileName - File name
 */
export const downloadCSV = (csvContent, fileName) => {
  // Detect iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Create blob and URL
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  if (isIOS) {
    // iOS specific handling
    // Open in a new window/tab which allows the user to share/save the file
    const newWindow = window.open(url);

    // If popup was blocked, fallback to direct navigation
    if (!newWindow) {
      window.location.href = url;
    }

    // Show a message to guide the user
    setTimeout(() => {
      alert('To save the file on iOS: tap the share button (box with arrow) and select "Download" or "Save to Files"');
    }, 500);

    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000); // 1 minute
  } else {
    // Standard download for other browsers
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
};

/**
 * Generate a template for form input mode
 * @returns {string} - CSV content
 */
export const generateFormInputTemplate = () => {
  const headers = ['sampleId', 'kcnq1', 'linc01785', 'age', 'afp', 'alb', 'ggt'];
  const exampleRow = ['sample1', '2.5', '3.1', '55', '4224', '37.6', '108.3'];

  return headers.join(',') + '\n' + exampleRow.join(',');
};

/**
 * Generate a template for score input mode
 * @returns {string} - CSV content
 */
export const generateScoreInputTemplate = () => {
  const headers = ['sampleId', 'score', 'age', 'afp', 'alb', 'ggt'];
  const exampleRow = ['sample1', '2.5', '55', '4224', '37.6', '108.3'];

  return headers.join(',') + '\n' + exampleRow.join(',');
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
