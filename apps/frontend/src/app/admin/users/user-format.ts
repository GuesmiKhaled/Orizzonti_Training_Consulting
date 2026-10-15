/** "+216 24 422 753" -> "+216 ••• ••• 753"; the middle digits are never shown in the list. */
export function maskPhone(phone: string | null | undefined): string {
  const value = (phone ?? '').trim();
  if (!value) {
    return '—';
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) {
    return value;
  }
  const prefix = value.startsWith('+') ? `+${digits.slice(0, 3)} ` : '';
  return `${prefix}••• ••• ${digits.slice(-3)}`;
}

export function displayName(user: {
  fullName?: string | null;
  username: string;
}): string {
  return user.fullName?.trim() || '—';
}
