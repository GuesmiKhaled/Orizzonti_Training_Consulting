export interface DetectedImageType {
  readonly ext: 'jpg' | 'png' | 'gif' | 'webp';
  readonly mime: string;
}

const startsWith = (buffer: Buffer, bytes: readonly number[], offset = 0): boolean =>
  bytes.every((byte, index) => buffer[offset + index] === byte);

/**
 * Identifies an image by its magic bytes. The client-supplied MIME type and
 * file name are never trusted.
 */
export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}
