export const IMAGE_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns an error message, or null when the file is acceptable. */
export function validateImageFile(
  file: Pick<File, 'type' | 'size'>,
  accept: readonly string[] = IMAGE_TYPES,
  maxBytes: number = MAX_IMAGE_BYTES,
): string | null {
  if (!accept.includes(file.type)) {
    const allowed = accept
      .map((type) => type.replace('image/', '').toUpperCase())
      .join(', ');
    return `Unsupported file type. Allowed: ${allowed}.`;
  }
  if (file.size > maxBytes) {
    return `Image is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  }
  return null;
}
