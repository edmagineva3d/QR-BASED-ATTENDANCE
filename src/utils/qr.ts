/**
 * Parse any scanned QR text payload into a normalized studentId.
 * Supports:
 *  - Direct plain text student ID ("STU-2026-001")
 *  - JSON payload ({"studentId":"STU-2026-001"} or {"id":"STU-2026-001"})
 *  - Query param in a URL (?studentId=STU-2026-001)
 */
export function parseQrPayload(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();

  // Try parsing as JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.studentId) return String(parsed.studentId).trim();
        if (parsed.id) return String(parsed.id).trim();
      }
    } catch {
      // Continue to check other formats
    }
  }

  // Try URL parameter
  if (trimmed.includes('?') && (trimmed.includes('studentId=') || trimmed.includes('id='))) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `http://dummy.com/${trimmed}`);
      const paramId = url.searchParams.get('studentId') || url.searchParams.get('id');
      if (paramId) return paramId.trim();
    } catch {
      // Not a valid URL
    }
  }

  // Default to the trimmed raw text as student ID
  return trimmed;
}

/**
 * Downloads a canvas element as a PNG image file
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const imageUri = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageUri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

