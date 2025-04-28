import fs from 'fs/promises';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import chalk from 'chalk';

/**
 * Parse a CSV file into an array of objects
 * @param {string} filePath - Path to the CSV file
 * @param {Function} transformer - Optional function to transform each row
 * @returns {Promise<Array>} Array of objects parsed from CSV
 */
export const parseCSV = async (filePath, transformer = null) => {
  const results = [];
  
  try {
    // Check if file exists
    await fs.access(filePath);
    
    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Apply transformer if provided
          if (transformer) {
            try {
              const transformed = transformer(data);
              if (transformed) {
                results.push(transformed);
              }
            } catch (error) {
              console.error(chalk.yellow(`Warning: Failed to process row: ${error.message}`));
            }
          } else {
            results.push(data);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`));
        });
    });
  } catch (error) {
    throw new Error(`Failed to read CSV file ${filePath}: ${error.message}`);
  }
};

/**
 * Validate required fields in CSV data
 * @param {Array} data - Array of objects from CSV
 * @param {Array} requiredFields - List of required field names
 * @returns {Array} - Array of objects with validation errors
 */
export const validateCSVData = (data, requiredFields) => {
  const errors = [];
  
  data.forEach((item, index) => {
    const rowErrors = [];
    
    requiredFields.forEach(field => {
      if (!item[field] || item[field].trim() === '') {
        rowErrors.push(`Missing required field: ${field}`);
      }
    });
    
    if (rowErrors.length > 0) {
      errors.push({
        row: index + 1,
        errors: rowErrors,
        data: item
      });
    }
  });
  
  return errors;
};