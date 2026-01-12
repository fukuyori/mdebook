/**
 * Encoding detection and conversion utilities
 * Supports: UTF-8, Shift_JIS, EUC-JP, ISO-2022-JP
 */

/**
 * Normalize line endings to LF (\n)
 * Converts CRLF (\r\n) and CR (\r) to LF (\n)
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Detect encoding from byte array
 * Returns detected encoding name
 */
export function detectEncoding(bytes: Uint8Array): string {
  // Check BOM (Byte Order Mark)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'UTF-8';
  }
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    return 'UTF-16BE';
  }
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    return 'UTF-16LE';
  }
  
  // Check for ISO-2022-JP (JIS) escape sequences
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x1B) { // ESC
      if ((bytes[i + 1] === 0x24 && bytes[i + 2] === 0x42) || // ESC $ B
          (bytes[i + 1] === 0x24 && bytes[i + 2] === 0x40) || // ESC $ @
          (bytes[i + 1] === 0x28 && bytes[i + 2] === 0x42) || // ESC ( B
          (bytes[i + 1] === 0x28 && bytes[i + 2] === 0x4A)) { // ESC ( J
        return 'ISO-2022-JP';
      }
    }
  }
  
  // Analyze byte patterns for Shift_JIS vs EUC-JP vs UTF-8
  let sjisScore = 0;
  let eucScore = 0;
  let utf8Score = 0;
  let utf8Invalid = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    
    // Check UTF-8 multi-byte sequences
    if ((b & 0x80) === 0) {
      // ASCII - valid in all encodings
      continue;
    } else if ((b & 0xE0) === 0xC0 && i + 1 < bytes.length) {
      // UTF-8 2-byte sequence
      if ((bytes[i + 1] & 0xC0) === 0x80) {
        utf8Score += 2;
        i += 1;
        continue;
      }
    } else if ((b & 0xF0) === 0xE0 && i + 2 < bytes.length) {
      // UTF-8 3-byte sequence (common for Japanese)
      if ((bytes[i + 1] & 0xC0) === 0x80 && (bytes[i + 2] & 0xC0) === 0x80) {
        utf8Score += 3;
        i += 2;
        continue;
      }
    } else if ((b & 0xF8) === 0xF0 && i + 3 < bytes.length) {
      // UTF-8 4-byte sequence
      if ((bytes[i + 1] & 0xC0) === 0x80 && (bytes[i + 2] & 0xC0) === 0x80 && (bytes[i + 3] & 0xC0) === 0x80) {
        utf8Score += 4;
        i += 3;
        continue;
      }
    }
    
    // If we get here with high bit set, it's not valid UTF-8
    if ((b & 0x80) !== 0) {
      utf8Invalid++;
    }
    
    // Check Shift_JIS patterns
    if (i + 1 < bytes.length) {
      const b2 = bytes[i + 1];
      
      // Shift_JIS double-byte: first byte 0x81-0x9F or 0xE0-0xFC
      // second byte 0x40-0x7E or 0x80-0xFC
      if (((b >= 0x81 && b <= 0x9F) || (b >= 0xE0 && b <= 0xFC)) &&
          ((b2 >= 0x40 && b2 <= 0x7E) || (b2 >= 0x80 && b2 <= 0xFC))) {
        sjisScore += 2;
        i += 1;
        continue;
      }
      
      // Shift_JIS half-width katakana: 0xA1-0xDF
      if (b >= 0xA1 && b <= 0xDF) {
        sjisScore += 1;
        continue;
      }
      
      // EUC-JP double-byte: both bytes 0xA1-0xFE
      if (b >= 0xA1 && b <= 0xFE && b2 >= 0xA1 && b2 <= 0xFE) {
        eucScore += 2;
        i += 1;
        continue;
      }
      
      // EUC-JP half-width katakana: 0x8E + 0xA1-0xDF
      if (b === 0x8E && b2 >= 0xA1 && b2 <= 0xDF) {
        eucScore += 2;
        i += 1;
        continue;
      }
    }
  }
  
  // If UTF-8 has no invalid sequences and has score, it's likely UTF-8
  if (utf8Invalid === 0 && utf8Score > 0) {
    return 'UTF-8';
  }
  
  // Compare scores
  if (sjisScore > eucScore && sjisScore > utf8Score) {
    return 'Shift_JIS';
  }
  if (eucScore > sjisScore && eucScore > utf8Score) {
    return 'EUC-JP';
  }
  if (utf8Score > 0) {
    return 'UTF-8';
  }
  
  // Default to UTF-8 for ASCII-only or unknown
  return 'UTF-8';
}

/**
 * Read file with automatic encoding detection
 * Returns decoded string with normalized line endings (LF)
 */
export async function readFileWithEncoding(file: File): Promise<string> {
  // Read file as ArrayBuffer first
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Detect encoding
  const encoding = detectEncoding(bytes);
  console.log(`Detected encoding for ${file.name}: ${encoding}`);
  
  // Decode with detected encoding
  let text: string;
  try {
    const decoder = new TextDecoder(encoding);
    text = decoder.decode(bytes);
  } catch (e) {
    // Fallback to UTF-8 if encoding is not supported
    console.warn(`Encoding ${encoding} not supported, falling back to UTF-8`);
    const decoder = new TextDecoder('UTF-8');
    text = decoder.decode(bytes);
  }
  
  // Normalize line endings to LF
  return normalizeLineEndings(text);
}

/**
 * Read text from ArrayBuffer with automatic encoding detection
 * Returns decoded string with normalized line endings (LF)
 */
export function decodeWithAutoDetect(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const encoding = detectEncoding(bytes);
  
  let text: string;
  try {
    const decoder = new TextDecoder(encoding);
    text = decoder.decode(bytes);
  } catch (e) {
    const decoder = new TextDecoder('UTF-8');
    text = decoder.decode(bytes);
  }
  
  // Normalize line endings to LF
  return normalizeLineEndings(text);
}

/**
 * Read text from Response with automatic encoding detection
 * Returns decoded string with normalized line endings (LF)
 */
export async function readResponseWithEncoding(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  return decodeWithAutoDetect(buffer);
}
