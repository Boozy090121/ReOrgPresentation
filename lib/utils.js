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
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Handle browsers that don't support download attribute (e.g., older IE)
    alert('CSV download is not supported in your browser.');
  }
};

// Example usage (within a component):
// import { arrayToCsv, downloadCSV } from '../lib/utils';
// const handleExport = () => {
//   const dataToExport = [{ col1: 'val1', col2: 'val2' }, { col1: 'val3', col2: 'val4' }];
//   const csvString = arrayToCsv(dataToExport);
//   downloadCSV(csvString, 'my_data.csv');
// }; 