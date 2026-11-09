/**
 * Normalizes Pakistani mobile number to international format (923XXXXXXXXX)
 */
export function normalizePakistanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('92')) {
    return digits;
  }
  if (digits.startsWith('03')) {
    return `92${digits.substring(1)}`;
  }
  if (digits.startsWith('3') && digits.length === 10) {
    return `92${digits}`;
  }
  return digits;
}

/**
 * Generates an HTTPS WhatsApp deep link with optional pre-filled inquiry text.
 */
export function generateWhatsAppDeepLink(rawPhoneNumber: string, propertyTitle?: string): string {
  const normalized = normalizePakistanPhoneForWhatsApp(rawPhoneNumber);
  const text = propertyTitle
    ? `Assalam-o-Alaikum, I am inquiring about "${propertyTitle}" on Rental Peshawar.`
    : 'Assalam-o-Alaikum, I am contacting you via Rental Peshawar.';

  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
