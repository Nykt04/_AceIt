import mammoth from 'mammoth';
import { logError } from './notificationService';

/**
 * Extract text from DOCX file
 * @param {File} file - DOCX file object
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromDOCX = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`[FileService] Extracting DOCX: ${file.name} (${file.size} bytes)`);
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File appears to be empty');
    }

    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value) {
      logError('extractTextFromDOCX', new Error('No text extracted'), { fileName: file.name });
      throw new Error('Could not extract any text from the DOCX file');
    }

    const extractedText = result.value.trim();
    console.log(`[FileService] Successfully extracted ${extractedText.length} characters from ${file.name}`);

    return extractedText;
  } catch (error) {
    logError('extractTextFromDOCX', error, { fileName: file?.name });
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

/**
 * Extract text from TXT file
 * @param {File} file - TXT file object
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromTXT = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`[FileService] Extracting TXT: ${file.name} (${file.size} bytes)`);

    const text = await file.text();

    if (!text || text.trim().length === 0) {
      throw new Error('File is empty');
    }

    const extractedText = text.trim();
    console.log(`[FileService] Successfully extracted ${extractedText.length} characters from ${file.name}`);

    return extractedText;
  } catch (error) {
    logError('extractTextFromTXT', error, { fileName: file?.name });
    throw new Error(`Failed to extract text from TXT: ${error.message}`);
  }
};

/**
 * Extract text from file based on file type
 * @param {File} file - File object (DOCX or TXT)
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromFile = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = file.name.toLowerCase();
    console.log(`[FileService] Starting extraction for: ${file.name}`);

    if (fileName.endsWith('.docx')) {
      return await extractTextFromDOCX(file);
    } else if (fileName.endsWith('.txt')) {
      return await extractTextFromTXT(file);
    } else {
      throw new Error('Unsupported file type. Please upload a DOCX or TXT file.');
    }
  } catch (error) {
    logError('extractTextFromFile', error, { fileName: file?.name, fileSize: file?.size });
    throw error;
  }
};

/**
 * Validate file before processing
 * @param {File} file - File object
 * @returns {boolean} True if valid
 */
export const isValidFile = (file) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  const validExtensions = ['.docx', '.txt'];

  const isValidType = validTypes.includes(file.type);
  const isValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

  return (isValidType || isValidExt) && isValidSize;
};

/**
 * Get file validation error message
 * @param {File} file - File object
 * @returns {string|null} Error message or null if valid
 */
export const getFileValidationError = (file) => {
  if (!file) return null;

  const validExtensions = ['.docx', '.txt'];
  const isValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidExt) {
    return 'Please upload a DOCX or TXT file. (PDF support coming soon)';
  }

  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size exceeds ${maxSizeMB}MB limit.`;
  }

  return null;
};
