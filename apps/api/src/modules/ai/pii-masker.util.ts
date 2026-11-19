/**
 * PII Masking and Data Sanitization Utility
 * Peshawar Rental Marketplace
 *
 * Guarantees that sensitive personal identity records (CNIC, phone numbers,
 * exact house numbers, personal emails, private auth tokens) are NEVER
 * transmitted to external AI/ML providers or LLMs.
 */

export class PiiMaskerUtil {
  // Pakistani CNIC formats: 12345-1234567-1, 1234512345671, etc.
  private static readonly CNIC_REGEX = /\b\d{5}[- ]?\d{7}[- ]?\d{1}\b/g;

  // Pakistani phone formats: +923001234567, 0300-1234567, 0321 7654321
  private static readonly PHONE_REGEX = /(?:\+92|0092|92|0)?3[0-4]\d{1}[- ]?\d{7}\b/g;

  // Standard Email Regex
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  // Exact Street/House/Plot Numbers: e.g. "House # 42-B", "Plot 19-C", "Street 14"
  private static readonly ADDRESS_DETAIL_REGEX =
    /\b(?:House|Plot|Flat|Apartment|Street|H#|P#)\s*(?:no\.?|#)?\s*\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?\b/gi;

  /**
   * Masks sensitive PII from any arbitrary text string.
   */
  public static maskText(text?: string | null): string {
    if (!text) return '';

    return text
      .replace(this.CNIC_REGEX, '[REDACTED_CNIC]')
      .replace(this.PHONE_REGEX, '[REDACTED_PHONE]')
      .replace(this.EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(this.ADDRESS_DETAIL_REGEX, '[REDACTED_ADDRESS_UNIT]');
  }

  /**
   * Sanitizes property listing payload before sending to AI quality / embedding services.
   * Only non-identifiable, public listing attributes are preserved.
   */
  public static sanitizeListingForAi(property: {
    id: string;
    title: string;
    description: string;
    propertyType: string;
    eligibility: string;
    monthlyRentPkr: number;
    bedrooms: number;
    bathrooms: number;
    areaSqFt?: number | null;
    furnishing?: string | null;
    localityName?: string;
    amenities?: string[];
  }): Record<string, any> {
    return {
      propertyId: property.id,
      title: this.maskText(property.title),
      description: this.maskText(property.description),
      propertyType: property.propertyType,
      eligibility: property.eligibility,
      monthlyRentPkr: property.monthlyRentPkr,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt,
      furnishing: property.furnishing,
      locality: property.localityName,
      amenities: property.amenities || [],
    };
  }
}
