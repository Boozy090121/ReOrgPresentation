/**
 * Converts an array of objects into a CSV string.
 * @param {Array<Object>} data Array of objects to convert.
 * @returns {string} CSV formatted string.
 */
const arrayToCsv = (data) => {
  if (!data || data.length === 0) {
    return '';
  }
  // Add check for data[0]
  const headers = data[0] ? Object.keys(data[0]) : [];
  if (headers.length === 0) return ''; // No headers, likely invalid data structure

  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\"\"'); // Escape double quotes
      return `"${escaped}"`; // Quote all fields
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

/**
 * Triggers a browser download for the given CSV string.
 * @param {string} csvString The CSV content.
 * @param {string} filename The desired filename for the download.
 */
export const downloadCSV = (csvString, filename) => {
  if (!csvString) return;

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to calculate the midpoint of a cost range string
export const getCostMidpoint = (costRange) => {
  if (!costRange || typeof costRange !== 'string') {
    return 0;
  }
  // Matches numbers like 50, 70k, $80K, 100,000
  const numbers = costRange.match(/\d[\d,.]*k?/gi);
  if (!numbers || numbers.length === 0) {
    return 0;
  }

  const parseValue = (numStr) => {
    let value = parseFloat(numStr.replace(/[$,k]/gi, ''));
    if (numStr.toLowerCase().includes('k')) {
      value *= 1000;
    }
    return value;
  };

  const values = numbers.map(parseValue);

  if (values.length === 1) {
    return values[0]; // If only one number, return it
  }

  // Calculate the average of the first two numbers found (usually min and max)
  if (values.length >= 2) {
      // Simple average of first two numbers assuming they represent the range ends
      return (values[0] + values[1]) / 2;
  }

  return 0; // Fallback
};

// Example usage (within a component):
// import { arrayToCsv, downloadCSV } from '../lib/utils';
// const handleExport = () => {
//   const dataToExport = [{ col1: 'val1', col2: 'val2' }, { col1: 'val3', col2: 'val4' }];
//   const csvString = arrayToCsv(dataToExport);
//   downloadCSV(csvString, 'my_data.csv');
// }; 