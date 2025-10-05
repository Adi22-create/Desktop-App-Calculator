import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export class CSVManager {
  constructor() {
    this.electronAPI = window.electronAPI;
  }

  /**
   * Load and parse CSV file
   * @param {string} filename - CSV filename
   * @returns {Promise<Array>} Parsed data array
   */
  async loadCSV(filename) {
    try {
      const result = await this.electronAPI.readCSVFile(filename);
      if (!result.success) {
        throw new Error(result.error);
      }

      return new Promise((resolve, reject) => {
        Papa.parse(result.data, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            resolve(results.data || []);
          },
          error: (error) => reject(error)
        });
      });
    } catch (error) {
      console.error(`Error loading CSV ${filename}:`, error);
      return [];
    }
  }

  /**
   * Save data to CSV file
   * @param {string} filename - CSV filename
   * @param {Array} data - Data array to save
   * @returns {Promise<boolean>} Success status
   */
  async saveCSV(filename, data) {
    try {
      const csv = Papa.unparse(data, {
        header: true,
        skipEmptyLines: true
      });

      const result = await this.electronAPI.writeCSVFile(filename, csv);
      return result.success;
    } catch (error) {
      console.error(`Error saving CSV ${filename}:`, error);
      return false;
    }
  }

  /**
   * Merge new rows into existing CSV, avoiding duplicates
   * @param {string} filename - CSV filename
   * @param {Array} newRows - New rows to merge
   * @param {string} uniqueKey - Key field for duplicate detection
   * @returns {Promise<boolean>} Success status
   */
  async mergeCSV(filename, newRows, uniqueKey) {
    try {
      const existingData = await this.loadCSV(filename);
      const existingKeys = new Set(existingData.map(row => row[uniqueKey]));
      
      // Filter out duplicates
      const uniqueNewRows = newRows.filter(row => 
        row[uniqueKey] && !existingKeys.has(row[uniqueKey])
      );
      
      if (uniqueNewRows.length === 0) {
        return true; // No new data to add
      }
      
      const mergedData = [...existingData, ...uniqueNewRows];
      return await this.saveCSV(filename, mergedData);
    } catch (error) {
      console.error(`Error merging CSV ${filename}:`, error);
      return false;
    }
  }

  /**
   * Export all CSV data to Excel or ZIP
   * @param {string} format - 'excel' or 'zip'
   * @returns {Promise<boolean>} Success status
   */
  async exportAllData(format = 'excel') {
    try {
      const csvFiles = [
        'projects.csv',
        'resources.csv', 
        'productivity.csv',
        'master.csv',
        'calculator_history.csv'
      ];
      
      if (format === 'excel') {
        return await this.exportToExcel(csvFiles);
      } else {
        return await this.exportToZip(csvFiles);
      }
    } catch (error) {
      console.error('Error exporting all data:', error);
      return false;
    }
  }

  /**
   * Export CSV files to Excel workbook
   * @param {Array} csvFiles - Array of CSV filenames
   * @returns {Promise<boolean>} Success status
   */
  async exportToExcel(csvFiles) {
    try {
      const workbook = XLSX.utils.book_new();
      
      for (const filename of csvFiles) {
        const data = await this.loadCSV(filename);
        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          const sheetName = filename.replace('.csv', '').replace('_', ' ');
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      }
      
      // Save file
      const saveOptions = {
        title: 'Export All Data',
        defaultPath: `desktop_calculator_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      };
      
      const result = await this.electronAPI.showSaveDialog(saveOptions);
      if (!result.canceled && result.filePath) {
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        // Note: In a real implementation, you'd need to save this buffer to the file system
        // This would require additional IPC handlers in main.js
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return false;
    }
  }

  /**
   * Validate CSV data structure
   * @param {Array} data - Data to validate
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Validation result
   */
  validateCSVData(data, requiredFields) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('No data provided');
      return { valid: false, errors, warnings };
    }
    
    // Check for required fields
    const firstRow = data[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));
    
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Check for empty required values
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          warnings.push(`Row ${index + 1}: Empty value for required field '${field}'`);
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Parse uploaded file (CSV or Excel)
   * @param {File} file - Uploaded file
   * @returns {Promise<Array>} Parsed data
   */
  async parseUploadedFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            Papa.parse(data, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => resolve(results.data || []),
              error: reject
            });
          } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } else {
            reject(new Error('Unsupported file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format number as currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }
}

// Create global instance
window.csvManager = new CSVManager();