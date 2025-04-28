import fs from 'fs/promises';

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Write data to a JSON file
 * @param {string} filePath - Path to file
 * @param {Object} data - Data to write
 */
export const writeJsonFile = async (filePath, data) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file: ${error.message}`);
  }
};

/**
 * Read JSON file
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Parsed JSON data
 */
export const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};