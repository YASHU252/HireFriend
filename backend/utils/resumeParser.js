import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

/**
 * Extracts and cleans text from a resume file buffer.
 * @param {Buffer} fileBuffer - Raw file bytes from multer memoryStorage
 * @param {string} mimetype   - MIME type of the uploaded file
 * @returns {Promise<string>} Cleaned plain-text content, max ~4000 chars
 */
export async function parseResume(fileBuffer, mimetype) {
  try {
    let raw = '';

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      raw = data.text || '';
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      raw = result.value || '';
    }

    return cleanText(raw);
  } catch (err) {
    console.error('Resume parse error:', err.message);
    return '';
  }
}

/**
 * Normalises whitespace, strips non-ASCII oddities, caps length.
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')      // collapse blank lines
    .replace(/[^\x20-\x7E\n]/g, ' ') // strip non-printable
    .replace(/ {2,}/g, ' ')           // collapse spaces
    .trim()
    .slice(0, 4000);                  // cap to keep Gemini prompts lean
}
