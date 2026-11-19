import {
  PropertySummaryDto,
  LocalityDto,
  TenantType,
  PropertyType,
  InquiryResponseDto,
  InquiryStatus,
  ReportReason,
  ConversationSummaryDto,
  MessageDto,
} from '@rental-peshawar/shared-types';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, token?: string | null) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || body?.message || 'API request failed');
  }

  return body.data;
}

export interface PropertyFilterParams {
  tenantType?: TenantType;
  localityId?: string;
  propertyType?: PropertyType;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  furnishing?: string;
  search?: string;
  sortBy?: 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULARITY';
  limit?: number;
  cursor?: string;
}

export async function getProperties(
  params: PropertyFilterParams = {},
  token?: string | null,
): Promise<{ items: PropertySummaryDto[]; nextCursor: string | null; hasMore: boolean }> {
  const searchParams = new URLSearchParams();
  if (params.tenantType) searchParams.append('tenantType', params.tenantType);
  if (params.localityId) searchParams.append('localityId', params.localityId);
  if (params.propertyType) searchParams.append('propertyType', params.propertyType);
  if (params.minRent) searchParams.append('minRent', params.minRent.toString());
  if (params.maxRent) searchParams.append('maxRent', params.maxRent.toString());
  if (params.minBedrooms) searchParams.append('minBedrooms', params.minBedrooms.toString());
  if (params.furnishing) searchParams.append('furnishing', params.furnishing);
  if (params.search) searchParams.append('search', params.search);
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.cursor) searchParams.append('cursor', params.cursor);

  const query = searchParams.toString();
  return fetchWithAuth(`/properties${query ? `?${query}` : ''}`, { method: 'GET' }, token);
}

export async function getFeaturedProperties(
  tenantType?: TenantType,
  limit = 6,
  token?: string | null,
): Promise<{ items: PropertySummaryDto[] }> {
  const query = tenantType ? `?tenantType=${tenantType}&limit=${limit}` : `?limit=${limit}`;
  return fetchWithAuth(`/properties/featured${query}`, { method: 'GET' }, token);
}

export async function getRecentProperties(
  tenantType?: TenantType,
  limit = 6,
  token?: string | null,
): Promise<{ items: PropertySummaryDto[] }> {
  const query = tenantType ? `?tenantType=${tenantType}&limit=${limit}` : `?limit=${limit}`;
  return fetchWithAuth(`/properties/recent${query}`, { method: 'GET' }, token);
}

export async function getPropertyBySlugOrId(
  idOrSlug: string,
  token?: string | null,
): Promise<PropertySummaryDto> {
  return fetchWithAuth(`/properties/${idOrSlug}`, { method: 'GET' }, token);
}

export async function getLocalities(): Promise<LocalityDto[]> {
  return fetchWithAuth('/localities', { method: 'GET' });
}

export async function getAmenities(): Promise<
  Array<{ id: string; name: string; code: string; category: string }>
> {
  try {
    return await fetchWithAuth('/properties/amenities', { method: 'GET' });
  } catch {
    return [
      { id: 'am-1', name: 'High-Speed Wi-Fi', code: 'WIFI', category: 'Connectivity' },
      { id: 'am-2', name: 'Backup Generator', code: 'GENERATOR', category: 'Utilities' },
      { id: 'am-3', name: 'UPS Inverter', code: 'UPS', category: 'Utilities' },
      { id: 'am-4', name: 'Water Bore / Filter', code: 'WATER', category: 'Utilities' },
      { id: 'am-5', name: 'Dedicated Car Parking', code: 'PARKING', category: 'Convenience' },
      { id: 'am-6', name: '24/7 Security Guard', code: 'SECURITY', category: 'Safety' },
      { id: 'am-7', name: 'Air Conditioning', code: 'AC', category: 'Comfort' },
      { id: 'am-8', name: 'Separate Kitchen', code: 'KITCHEN', category: 'Features' },
    ];
  }
}

export async function addFavorite(propertyId: string, token: string) {
  return fetchWithAuth(`/properties/${propertyId}/favorite`, { method: 'POST' }, token);
}

export async function removeFavorite(propertyId: string, token: string) {
  return fetchWithAuth(`/properties/${propertyId}/favorite`, { method: 'DELETE' }, token);
}

export async function getFavorites(
  token: string,
): Promise<Array<{ id: string; propertyId: string; property: PropertySummaryDto }>> {
  return fetchWithAuth('/favorites', { method: 'GET' }, token);
}

export async function getFavoriteIds(token: string): Promise<string[]> {
  return fetchWithAuth('/favorites/ids', { method: 'GET' }, token);
}

export async function submitInquiry(
  dto: { propertyId: string; message: string; proposedMoveInDate?: string },
  token: string,
) {
  return fetchWithAuth(
    '/inquiries',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token,
  );
}

export async function getMyInquiries(token: string): Promise<InquiryResponseDto[]> {
  return fetchWithAuth('/inquiries', { method: 'GET' }, token);
}

export async function getInquiryById(id: string, token: string): Promise<InquiryResponseDto> {
  return fetchWithAuth(`/inquiries/${id}`, { method: 'GET' }, token);
}

export async function getLandlordInquiries(token: string): Promise<InquiryResponseDto[]> {
  return fetchWithAuth('/landlord/inquiries', { method: 'GET' }, token);
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
  token: string,
  note?: string,
): Promise<InquiryResponseDto> {
  return fetchWithAuth(
    `/landlord/inquiries/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    },
    token,
  );
}

export async function deleteInquiry(
  id: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  return fetchWithAuth(`/inquiries/${id}`, { method: 'DELETE' }, token);
}

// ==========================================
// Conversations & Real-Time Messaging APIs
// ==========================================

export async function getConversations(token: string): Promise<ConversationSummaryDto[]> {
  return fetchWithAuth('/conversations', { method: 'GET' }, token);
}

export async function getConversationMessages(id: string, token: string): Promise<MessageDto[]> {
  return fetchWithAuth(`/conversations/${id}/messages`, { method: 'GET' }, token);
}

export async function sendConversationMessage(
  id: string,
  content: string,
  token: string,
): Promise<MessageDto> {
  return fetchWithAuth(
    `/conversations/${id}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    token,
  );
}

export async function markConversationRead(
  id: string,
  token: string,
): Promise<{ success: boolean; updatedCount: number; readAt: string }> {
  return fetchWithAuth(`/conversations/${id}/read`, { method: 'PATCH' }, token);
}

export async function blockConversation(
  id: string,
  token: string,
  reason?: string,
): Promise<{ id: string; isBlocked: boolean; blockedById: string }> {
  return fetchWithAuth(
    `/conversations/${id}/block`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    token,
  );
}

export async function reportConversation(
  id: string,
  reason: ReportReason,
  details: string,
  token: string,
) {
  return fetchWithAuth(
    `/conversations/${id}/report`,
    {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    },
    token,
  );
}

// ==========================================
// Notifications & Device Tokens APIs
// ==========================================

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(token: string): Promise<AppNotification[]> {
  return fetchWithAuth('/notifications', { method: 'GET' }, token);
}

export async function markNotificationRead(id: string, token: string): Promise<AppNotification> {
  return fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' }, token);
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ success: boolean; updatedCount: number }> {
  return fetchWithAuth('/notifications/read-all', { method: 'PATCH' }, token);
}

export async function registerDeviceToken(
  fcmToken: string,
  platform: 'ANDROID' | 'IOS' | 'WEB',
  token: string,
) {
  return fetchWithAuth(
    '/devices',
    {
      method: 'POST',
      body: JSON.stringify({ fcmToken, platform }),
    },
    token,
  );
}

export async function deleteDeviceToken(id: string, token: string) {
  return fetchWithAuth(`/devices/${id}`, { method: 'DELETE' }, token);
}

export async function submitReport(
  dto: {
    targetType: 'PROPERTY' | 'USER';
    targetId: string;
    reason: ReportReason;
    details?: string;
  },
  token: string,
) {
  return fetchWithAuth(
    '/reports',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    },
    token,
  );
}

export async function loginUser(emailOrPhone: string, password: string) {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, password }),
  });
}

export async function registerTenant(dto: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  tenantType: TenantType;
}) {
  return fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...dto,
      role: 'TENANT',
    }),
  });
}

export async function registerLandlord(dto: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}) {
  return fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...dto,
      role: 'LANDLORD',
    }),
  });
}

// ==========================================
// LANDLORD OPERATIONS & ANALYTICS APIs
// ==========================================

export async function getLandlordDashboard(token: string) {
  return fetchWithAuth('/landlord/dashboard', { method: 'GET' }, token);
}

export async function getLandlordProperties(token: string) {
  return fetchWithAuth('/landlord/properties', { method: 'GET' }, token);
}

export async function getLandlordProperty(id: string, token: string) {
  return fetchWithAuth(`/landlord/properties/${id}`, { method: 'GET' }, token);
}

export async function createLandlordProperty(data: any, token: string) {
  return fetchWithAuth(
    '/landlord/properties',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateLandlordProperty(id: string, data: any, token: string) {
  return fetchWithAuth(
    `/landlord/properties/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateLandlordPropertyStatus(id: string, status: string, token: string) {
  return fetchWithAuth(
    `/landlord/properties/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    token,
  );
}

export async function deleteLandlordProperty(id: string, token: string) {
  return fetchWithAuth(`/landlord/properties/${id}`, { method: 'DELETE' }, token);
}

export async function getLandlordPropertyAnalytics(id: string, token: string) {
  return fetchWithAuth(`/landlord/properties/${id}/analytics`, { method: 'GET' }, token);
}

export async function checkDuplicateListing(data: any, token: string) {
  return fetchWithAuth(
    '/landlord/properties/check-duplicate',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function updateLandlordPropertyImages(id: string, images: any[], token: string) {
  return fetchWithAuth(
    `/landlord/properties/${id}/images`,
    {
      method: 'PATCH',
      body: JSON.stringify({ images }),
    },
    token,
  );
}

export async function getLandlordInquiry(id: string, token: string) {
  return fetchWithAuth(`/landlord/inquiries/${id}`, { method: 'GET' }, token);
}

export async function updateLandlordInquiryStatus(
  id: string,
  status: string,
  note: string | undefined,
  token: string,
) {
  return fetchWithAuth(
    `/landlord/inquiries/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    },
    token,
  );
}

export async function getLandlordVerification(token: string) {
  return fetchWithAuth('/landlord/verification', { method: 'GET' }, token);
}

export async function submitLandlordVerification(data: any, token: string) {
  return fetchWithAuth(
    '/landlord/verification',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function recordPropertyView(
  propertyId: string,
  source: 'WEB' | 'MOBILE' | 'ADMIN_REFERRAL' = 'WEB',
  localityId?: string,
) {
  return fetchWithAuth(`/properties/${propertyId}/view`, {
    method: 'POST',
    body: JSON.stringify({ source, localityId }),
  });
}

// ==========================================
// PHASE 11: REVIEWS, REPUTATION & TRUST APIS
// ==========================================

export async function getPropertyReviews(propertyId: string, query?: Record<string, any>) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return fetchWithAuth(`/properties/${propertyId}/reviews${qs}`, { method: 'GET' });
}

export async function submitPropertyReview(propertyId: string, data: any, token: string) {
  return fetchWithAuth(
    `/properties/${propertyId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getMyReviews(token: string) {
  return fetchWithAuth('/reviews/my', { method: 'GET' }, token);
}

export async function updateReview(reviewId: string, data: any, token: string) {
  return fetchWithAuth(
    `/reviews/${reviewId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deleteReview(reviewId: string, token: string) {
  return fetchWithAuth(`/reviews/${reviewId}`, { method: 'DELETE' }, token);
}

export async function replyToReview(reviewId: string, content: string, token: string) {
  return fetchWithAuth(
    `/reviews/${reviewId}/reply`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    token,
  );
}

export async function reportReview(
  reviewId: string,
  data: { reason: string; details?: string },
  token: string,
) {
  return fetchWithAuth(
    `/reviews/${reviewId}/report`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getLandlordReputation(landlordId: string) {
  return fetchWithAuth(`/landlords/${landlordId}/reputation`, { method: 'GET' });
}

export async function getPropertyQuality(propertyId: string) {
  return fetchWithAuth(`/properties/${propertyId}/quality`, { method: 'GET' });
}

// ==========================================
// PHASE 12: SAVED SEARCHES, ALERTS & RECOMMENDATIONS
// ==========================================

export async function createSavedSearch(data: any, token: string) {
  return fetchWithAuth(
    '/saved-searches',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getMySavedSearches(token: string) {
  return fetchWithAuth('/saved-searches', { method: 'GET' }, token);
}

export async function getSavedSearch(id: string, token: string) {
  return fetchWithAuth(`/saved-searches/${id}`, { method: 'GET' }, token);
}

export async function updateSavedSearch(id: string, data: any, token: string) {
  return fetchWithAuth(
    `/saved-searches/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function deleteSavedSearch(id: string, token: string) {
  return fetchWithAuth(`/saved-searches/${id}`, { method: 'DELETE' }, token);
}

export async function updateSavedSearchAlerts(
  id: string,
  data: { alertsEnabled: boolean; frequency?: string },
  token: string,
) {
  return fetchWithAuth(
    `/saved-searches/${id}/alerts`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getNotificationPreferences(token: string) {
  return fetchWithAuth('/notification-preferences', { method: 'GET' }, token);
}

export async function updateNotificationPreferences(data: any, token: string) {
  return fetchWithAuth(
    '/notification-preferences',
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getForYouRecommendations(query?: Record<string, any>, token?: string) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return fetchWithAuth(`/recommendations/for-you${qs}`, { method: 'GET' }, token);
}

export async function getSimilarProperties(propertyId: string, limit = 6, token?: string) {
  return fetchWithAuth(
    `/recommendations/similar/${propertyId}?limit=${limit}`,
    { method: 'GET' },
    token,
  );
}

export async function getNearbyProperties(query?: Record<string, any>, token?: string) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return fetchWithAuth(`/recommendations/nearby${qs}`, { method: 'GET' }, token);
}

export async function getTrendingProperties(query?: Record<string, any>, token?: string) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return fetchWithAuth(`/recommendations/trending${qs}`, { method: 'GET' }, token);
}

export async function getRecentlyViewedProperties(sessionId?: string, limit = 10, token?: string) {
  const qs = new URLSearchParams();
  if (sessionId) qs.append('sessionId', sessionId);
  if (limit) qs.append('limit', limit.toString());
  return fetchWithAuth(
    `/recommendations/recently-viewed?${qs.toString()}`,
    { method: 'GET' },
    token,
  );
}

export async function recordPropertyImpression(
  data: {
    propertyId: string;
    surface: string;
    position?: number;
    sessionId?: string;
    metadata?: any;
  },
  token?: string,
) {
  return fetchWithAuth(
    '/events/property-impression',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function recordPropertyClick(
  data: {
    propertyId: string;
    surface: string;
    position?: number;
    sessionId?: string;
    metadata?: any;
  },
  token?: string,
) {
  return fetchWithAuth(
    '/events/property-click',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function recordSearchQueryEvent(
  data: {
    queryText?: string;
    filters: Record<string, any>;
    localityId?: string;
    resultsCount?: number;
    executionTimeMs?: number;
    sessionId?: string;
  },
  token?: string,
) {
  return fetchWithAuth(
    '/events/search-query',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

// ==========================================
// PHASE 13: BOOKINGS, PAYMENTS, AGREEMENTS & DISPUTES
// ==========================================

export async function createBookingRequest(
  data: {
    inquiryId: string;
    propertyId: string;
    startDate: string;
    endDate: string;
    tenantCount?: number;
    notes?: string;
  },
  token: string,
) {
  return fetchWithAuth(
    '/bookings',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getMyBookings(role?: 'TENANT' | 'LANDLORD', token?: string) {
  const qs = role ? `?role=${role}` : '';
  return fetchWithAuth(`/bookings/my${qs}`, { method: 'GET' }, token);
}

export async function getBookingById(bookingId: string, token: string) {
  return fetchWithAuth(`/bookings/${bookingId}`, { method: 'GET' }, token);
}

export async function updateBookingStatus(
  bookingId: string,
  data: { status: string; notes?: string },
  token: string,
) {
  return fetchWithAuth(
    `/bookings/${bookingId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function cancelBooking(
  bookingId: string,
  data: { cancellationReason: string },
  token: string,
) {
  return fetchWithAuth(
    `/bookings/${bookingId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function createPaymentIntent(
  data: {
    bookingId: string;
    amountPkr?: number;
    paymentMethodType: string;
    idempotencyKey?: string;
    metadata?: any;
  },
  token: string,
) {
  return fetchWithAuth(
    '/payments/intent',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function submitManualPaymentSlip(
  data: {
    bookingId: string;
    bankName: string;
    transactionReference: string;
    slipUrl: string;
    amountPkr: number;
    accountTitle?: string;
  },
  token: string,
) {
  return fetchWithAuth(
    '/payments/manual-slip',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function verifyManualPayment(
  paymentId: string,
  data: { approved: boolean; rejectionReason?: string },
  token: string,
) {
  return fetchWithAuth(
    `/payments/${paymentId}/verify-manual`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getReceiptByNumber(receiptNumber: string) {
  return fetchWithAuth(`/payments/receipts/${receiptNumber}`, { method: 'GET' });
}

export async function getReceiptByPaymentId(paymentId: string, token: string) {
  return fetchWithAuth(`/payments/${paymentId}/receipt`, { method: 'GET' }, token);
}

export async function getAgreementForBooking(bookingId: string, token: string) {
  return fetchWithAuth(`/agreements/booking/${bookingId}`, { method: 'GET' }, token);
}

export async function getAgreementById(agreementId: string, token: string) {
  return fetchWithAuth(`/agreements/${agreementId}`, { method: 'GET' }, token);
}

export async function signAgreement(
  agreementId: string,
  data: { signatureData?: string },
  token: string,
) {
  return fetchWithAuth(
    `/agreements/${agreementId}/sign`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function createDispute(
  data: {
    bookingId: string;
    category: string;
    description: string;
    amountDisputedPkr?: number;
    evidenceUrls?: string[];
  },
  token: string,
) {
  return fetchWithAuth(
    '/disputes',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}

export async function getMyDisputes(token: string) {
  return fetchWithAuth('/disputes/my', { method: 'GET' }, token);
}

export async function getDisputeById(disputeId: string, token: string) {
  return fetchWithAuth(`/disputes/${disputeId}`, { method: 'GET' }, token);
}

export async function sendDisputeMessage(
  disputeId: string,
  data: { message: string; attachmentUrls?: string[] },
  token: string,
) {
  return fetchWithAuth(
    `/disputes/${disputeId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    token,
  );
}
