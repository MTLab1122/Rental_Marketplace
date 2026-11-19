'use client';

export type AnalyticsEvent =
  | 'page_view'
  | 'property_view'
  | 'search_filter_applied'
  | 'zero_result_search'
  | 'inquiry_initiated'
  | 'inquiry_submitted'
  | 'whatsapp_click'
  | 'phone_reveal'
  | 'favorite_toggle'
  | 'booking_start'
  | 'booking_complete';

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | undefined | null;
}

export function trackEvent(eventName: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  try {
    if (typeof window === 'undefined') return;

    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      ...payload,
    };

    // Google Tag Manager / GA4 dataLayer integration
    const windowWithDataLayer = window as any;
    if (windowWithDataLayer.dataLayer && Array.isArray(windowWithDataLayer.dataLayer)) {
      windowWithDataLayer.dataLayer.push(eventData);
    }

    // In non-production or test environments, log for debugging
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[RentPeshawar Analytics] ${eventName}:`, eventData);
    }
  } catch {
    // Fail silently so user experience is never blocked by tracking errors
  }
}

export function trackPageView(path: string, title: string, locality?: string): void {
  trackEvent('page_view', { path, title, locality });
}

export function trackPropertyView(
  propertyId: string,
  locality?: string,
  propertyType?: string,
  rentPkr?: number,
): void {
  trackEvent('property_view', { propertyId, locality, propertyType, rentPkr });
}

export function trackSearchFilter(params: {
  query?: string;
  locality?: string;
  minRent?: number;
  maxRent?: number;
  propertyType?: string;
  resultCount?: number;
}): void {
  if (params.resultCount === 0) {
    trackEvent('zero_result_search', params);
  } else {
    trackEvent('search_filter_applied', params);
  }
}

export function trackInquiryInitiated(propertyId: string, propertyTitle: string): void {
  trackEvent('inquiry_initiated', { propertyId, propertyTitle });
}

export function trackInquirySubmitted(propertyId: string, inquiryId?: string): void {
  trackEvent('inquiry_submitted', { propertyId, inquiryId });
}

export function trackWhatsAppClick(propertyId: string): void {
  trackEvent('whatsapp_click', { propertyId });
}

export function trackPhoneReveal(propertyId: string): void {
  trackEvent('phone_reveal', { propertyId });
}

export function trackFavoriteToggle(propertyId: string, isFavorited: boolean): void {
  trackEvent('favorite_toggle', { propertyId, isFavorited });
}

export function trackBookingStart(propertyId: string): void {
  trackEvent('booking_start', { propertyId });
}

export function trackBookingComplete(bookingId: string, amountPkr: number): void {
  trackEvent('booking_complete', { bookingId, amountPkr });
}
