import mammoth from 'mammoth';
import { logError } from './notificationService';
import Tesseract from 'tesseract.js';

/**
 * Extract images from DOCX file and perform OCR
 * @param {ArrayBuffer} arrayBuffer - DOCX file as ArrayBuffer
 * @returns {Promise<string>} OCR text from images
 */
const extractTextFromImagesInDOCX = async (arrayBuffer) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);

    const imageFiles = [];
    
    // Find all image files in the document
    zip.folder('word/media')?.forEach((relativePath, file) => {
      if (relativePath.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        imageFiles.push(file);
      }
    });

    if (imageFiles.length === 0) {
      return '';
    }

    console.log(`[FileService] Found ${imageFiles.length} images in DOCX, running OCR...`);

    let allOCRText = '';

    // Process each image with Tesseract OCR
    for (const file of imageFiles) {
      try {
        const imageData = await file.async('blob');
        const imageUrl = URL.createObjectURL(imageData);

        // Use the default worker
        const worker = await Tesseract.createWorker();
        const result = await worker.recognize(imageUrl);
        const ocrText = result.data.text;
        await worker.terminate();

        console.log(`[FileService] OCR extracted ${ocrText.length} characters from ${file.name}`);
        allOCRText += '\n' + ocrText;

        URL.revokeObjectURL(imageUrl);
      } catch (ocrError) {
        console.warn(`[FileService] OCR failed for ${file.name}:`, ocrError.message);
        // Continue with other images if one fails
      }
    }

    return allOCRText.trim();
  } catch (error) {
    console.warn('[FileService] Image extraction failed:', error.message);
    return '';
  }
};

/**
 * Extract text from DOCX file
 * @param {File} file - DOCX file object
 * @returns {Promise<{text: string, isEmpty: boolean, warning?: string}>}
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
    let extractedText = (result.value || '').trim();

    console.log(`[FileService] Extracted ${extractedText.length} characters from ${file.name}`);

    // If document has minimal text, try extracting text from images using OCR
    if (extractedText.length < 50) {
      console.log('[FileService] Text content is minimal, attempting OCR on embedded images...');
      
      try {
        const ocrText = await extractTextFromImagesInDOCX(arrayBuffer);
        if (ocrText.length > 0) {
          extractedText = extractedText + '\n' + ocrText;
          console.log(`[FileService] OCR added ${ocrText.length} characters of image text`);
        }
      } catch (ocrError) {
        console.warn('[FileService] OCR processing failed:', ocrError.message);
      }
    }

    // Final check after OCR attempt
    if (extractedText.trim().length < 10) {
      console.warn('[FileService] Document appears to have minimal or no text content even after OCR');
      return {
        text: extractedText.trim(),
        isEmpty: true,
        warning: 'Document contains minimal text. Please ensure your document has readable content.',
      };
    }

    return {
      text: extractedText.trim(),
      isEmpty: false,
    };
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
 * Extract text from PDF file using CDN
 * @param {File} file - PDF file object
 * @returns {Promise<{text: string, isEmpty: boolean, warning?: string}>}
 */
export const extractTextFromPDF = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`[FileService] Extracting PDF: ${file.name} (${file.size} bytes)`);
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File appears to be empty');
    }

    // Load PDF.js from CDN
    if (!window.pdfjsLib) {
      // Load the main PDF.js script
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const pdfjsLib = window.pdfjsLib;
    
    // Set the worker from CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = '';

    console.log(`[FileService] PDF has ${pdf.numPages} pages`);

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        extractedText += pageText + '\n';
      } catch (pageError) {
        console.warn(`[FileService] Error extracting page ${pageNum}:`, pageError.message);
        // Continue with next page if one fails
      }
    }

    extractedText = extractedText.trim();
    console.log(`[FileService] Extracted ${extractedText.length} characters from ${file.name}`);

    // Check if PDF has minimal text (likely image-only or scanned PDF)
    if (extractedText.length < 50) {
      console.warn('[FileService] PDF appears to have minimal or no text content');
      return {
        text: extractedText,
        isEmpty: true,
        warning: 'PDF contains minimal or no extractable text. This may be a scanned PDF with images. Consider using an OCR tool.',
      };
    }

    return {
      text: extractedText,
      isEmpty: false,
    };
  } catch (error) {
    logError('extractTextFromPDF', error, { fileName: file?.name });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract text from file based on file type
 * Handles: DOCX, TXT, and direct image files
 * @param {File} file - File object
 * @returns {Promise<{text: string, isEmpty: boolean, warning?: string}>}
 */
export const extractTextFromFile = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileName = file.name.toLowerCase();
    console.log(`[FileService] Starting extraction for: ${file.name}`);

    if (fileName.endsWith('.docx')) {
      const result = await extractTextFromDOCX(file);
      
      if (result.isEmpty) {
        return {
          text: result.text,
          isEmpty: true,
          warning: `⚠️ NO READABLE CONTENT DETECTED\n\nYour document doesn't contain extractable text. This could mean:\n\n• Document has only images (OCR was attempted but unsuccessful)\n• Document is empty or corrupted\n• Format is not standard DOCX\n\n💡 SOLUTIONS:\n1. Ensure images in the document are clear and readable\n2. Try using a different OCR tool (smallpdf.com, ilovepdf.com)\n3. Type out the content manually\n4. Save and re-upload the document`,
        };
      }
      return result;
    } else if (fileName.endsWith('.pdf')) {
      const result = await extractTextFromPDF(file);
      
      if (result.isEmpty) {
        return {
          text: result.text,
          isEmpty: true,
          warning: `⚠️ SCANNED PDF DETECTED\n\nYour PDF appears to be scanned images with no extractable text.\n\n💡 SOLUTIONS:\n1. Use an OCR tool: smallpdf.com, ilovepdf.com\n2. Or try uploading as image files first, then use OCR\n3. If text-based, ensure PDF is not corrupted`,
        };
      }
      return result;
    } else if (fileName.endsWith('.txt')) {
      const text = await extractTextFromTXT(file);
      return { text, isEmpty: false };
    } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return {
        text: '',
        isEmpty: true,
        warning: `⚠️ IMAGE FILE UPLOADED\n\nDirect image upload is not yet supported. Please:\n\n1. Use an OCR tool to extract text from your image:\n   - Online: smallpdf.com, ilovepdf.com\n   - Local: Google Lens, Microsoft Lens\n\n2. Save the extracted text as a .txt, .pdf, or .docx file\n\n3. Upload the text file instead`,
      };
    } else {
      throw new Error('Unsupported file type. Please upload a DOCX, PDF, or TXT file.');
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
    'application/pdf',
  ];
  const validExtensions = ['.docx', '.txt', '.pdf'];

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

  const validExtensions = ['.docx', '.txt', '.pdf'];
  const isValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidExt) {
    return 'Please upload a DOCX, PDF, or TXT file.';
  }

  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size exceeds ${maxSizeMB}MB limit.`;
  }

  return null;
};
