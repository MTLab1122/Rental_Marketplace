/**
 * Administrative Control Console API Client
 * Peshawar Rental Marketplace
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      json?.message || json?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

// ==========================================
// ADMIN AUTH & MFA
// ==========================================
export async function adminLogin(payload: {
  emailOrPhone: string;
  password: string;
  totpToken?: string;
}) {
  return request<{
    requiresMfa?: boolean;
    tokens?: { accessToken: string; refreshToken: string };
    user?: { id: string; email: string; fullName: string; roles: string[]; isMfaEnabled: boolean };
    message?: string;
  }>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setupMfa() {
  return request<{ secret: string; otpauthUrl: string; instructions: string }>(
    '/admin/auth/mfa/setup',
    {
      method: 'POST',
    },
  );
}

export async function verifyMfa(token: string) {
  return request<{ message: string; isMfaEnabled: boolean }>('/admin/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ==========================================
// ANALYTICS & OVERVIEW
// ==========================================
export async function getAdminAnalytics(query?: Record<string, any>) {
  const params = query ? `?${new URLSearchParams(query).toString()}` : '';
  return request<any>(`/admin/analytics${params}`);
}

export async function getAdminTrends() {
  return request<{ daily: { date: string; views: number; inquiries: number; listings: number }[] }>(
    '/admin/analytics/trends',
  );
}

// ==========================================
// USER MANAGEMENT
// ==========================================
export async function getAdminUsers(params?: Record<string, any>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>(
    `/admin/users${qs}`,
  );
}

export async function getAdminUser(id: string) {
  return request<any>(`/admin/users/${id}`);
}

export async function suspendUser(id: string, reason: string) {
  return request<{ id: string; isSuspended: boolean; message: string }>(
    `/admin/users/${id}/suspend`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export async function unsuspendUser(id: string) {
  return request<{ id: string; isSuspended: boolean; message: string }>(
    `/admin/users/${id}/unsuspend`,
    {
      method: 'POST',
    },
  );
}

export async function updateUserRole(id: string, role: string) {
  return request<{ id: string; roles: string[]; message: string }>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(id: string) {
  return request<{ id: string; message: string }>(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// VERIFICATION QUEUE
// ==========================================
export async function getAdminVerifications(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<any[]>(`/admin/verifications${qs}`);
}

export async function getAdminVerification(id: string) {
  return request<any>(`/admin/verifications/${id}`);
}

export async function approveVerification(id: string, reviewNotes?: string) {
  return request<any>(`/admin/verifications/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewNotes }),
  });
}

export async function rejectVerification(id: string, reason: string) {
  return request<any>(`/admin/verifications/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, reviewNotes: reason }),
  });
}

export async function expireVerification(id: string) {
  return request<any>(`/admin/verifications/${id}/expire`, {
    method: 'PATCH',
  });
}

// ==========================================
// PROPERTY MODERATION QUEUE
// ==========================================
export async function getAdminProperties(params?: Record<string, any>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>(
    `/admin/properties${qs}`,
  );
}

export async function getAdminProperty(id: string) {
  return request<any>(`/admin/properties/${id}`);
}

export async function approveProperty(id: string) {
  return request<any>(`/admin/properties/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectProperty(id: string, reason: string) {
  return request<any>(`/admin/properties/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function suspendProperty(id: string, reason: string) {
  return request<any>(`/admin/properties/${id}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function restoreProperty(id: string) {
  return request<any>(`/admin/properties/${id}/restore`, {
    method: 'PATCH',
  });
}

export async function deleteProperty(id: string) {
  return request<any>(`/admin/properties/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// REPORT MANAGEMENT
// ==========================================
export async function getAdminReports(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<any[]>(`/admin/reports${qs}`);
}

export async function getAdminReport(id: string) {
  return request<any>(`/admin/reports/${id}`);
}

export async function resolveReport(id: string, resolutionNotes: string) {
  return request<any>(`/admin/reports/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
}

export async function dismissReport(id: string, resolutionNotes: string) {
  return request<any>(`/admin/reports/${id}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
}

// ==========================================
// LOCALITIES
// ==========================================
export async function getAdminLocalities() {
  return request<any[]>('/admin/localities');
}

export async function getAdminLocality(id: string) {
  return request<any>(`/admin/localities/${id}`);
}

export async function createLocality(payload: {
  name: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  description?: string;
  boundaryGeoJson?: any;
}) {
  return request<any>('/admin/localities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLocality(id: string, payload: Record<string, any>) {
  return request<any>(`/admin/localities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateLocalityStatus(id: string, isActive: boolean) {
  return request<any>(`/admin/localities/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteLocality(id: string) {
  return request<any>(`/admin/localities/${id}`, {
    method: 'DELETE',
  });
}

// ==========================================
// AUDIT LOGS
// ==========================================
export async function getAdminAuditLogs(params?: Record<string, any>) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>(
    `/admin/audit-logs${qs}`,
  );
}

// ==========================================
// SETTINGS & FEATURE FLAGS
// ==========================================
export async function getAdminSettings() {
  return request<any[]>('/admin/settings');
}

export async function updateAdminSetting(key: string, value: any, description?: string) {
  return request<any>(`/admin/settings/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify({ value, description }),
  });
}

export async function getAdminFeatureFlags() {
  return request<any[]>('/admin/settings/flags');
}

export async function updateAdminFeatureFlag(key: string, enabled: boolean) {
  return request<any>(`/admin/settings/flags/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

// ==========================================
// PHASE 12: DISCOVERY, ALERTS & DEMAND APIS
// ==========================================

export async function getDiscoveryAnalytics() {
  return request<any>('/admin/discovery/analytics');
}

export async function getDiscoveryAlerts(limit = 50) {
  return request<any[]>(`/admin/discovery/alerts?limit=${limit}`);
}

export async function getLocalityDemand(localityId?: string, period = 'DAILY') {
  const qs = new URLSearchParams();
  if (localityId) qs.append('localityId', localityId);
  if (period) qs.append('period', period);
  return request<any[]>(`/admin/discovery/locality-demand?${qs.toString()}`);
}

// ==========================================
// PHASE 13: BOOKINGS, ESCROW LEDGER & DISPUTES
// ==========================================

export async function getAllBookingsAdmin(status?: string, propertyId?: string) {
  const qs = new URLSearchParams();
  if (status) qs.append('status', status);
  if (propertyId) qs.append('propertyId', propertyId);
  return request<any[]>(`/admin/bookings?${qs.toString()}`);
}

export async function getLedgerReconciliationAdmin(
  bookingId?: string,
  startDate?: string,
  endDate?: string,
) {
  const qs = new URLSearchParams();
  if (bookingId) qs.append('bookingId', bookingId);
  if (startDate) qs.append('startDate', startDate);
  if (endDate) qs.append('endDate', endDate);
  return request<any>(`/admin/ledger?${qs.toString()}`);
}

export async function postLedgerAdjustmentAdmin(data: {
  bookingId?: string;
  paymentId?: string;
  amountPkr: number;
  description: string;
  reason: string;
}) {
  return request<any>('/admin/ledger/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAllDisputesAdmin(status?: string, category?: string) {
  const qs = new URLSearchParams();
  if (status) qs.append('status', status);
  if (category) qs.append('category', category);
  return request<any[]>(`/admin/disputes?${qs.toString()}`);
}

export async function resolveDisputeAdmin(
  disputeId: string,
  data: { status: string; resolution: string },
) {
  return request<any>(`/disputes/${disputeId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function refundPaymentAdmin(
  paymentId: string,
  data: { amountPkr: number; reason: string },
) {
  return request<any>(`/payments/${paymentId}/refund`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==========================================
// PHASE 14: JOBS, EVENTS, CACHE & DATA PLATFORM
// ==========================================

export async function getQueueMetricsAdmin() {
  return request<any[]>('/admin/jobs/metrics');
}

export async function getDeadLetterJobsAdmin(queueName?: string, isResolved?: boolean) {
  const qs = new URLSearchParams();
  if (queueName) qs.append('queueName', queueName);
  if (isResolved !== undefined) qs.append('isResolved', String(isResolved));
  return request<any[]>(`/admin/jobs/dlq?${qs.toString()}`);
}

export async function retryDlqJobAdmin(id: string) {
  return request<any>(`/admin/jobs/dlq/${id}/retry`, {
    method: 'POST',
  });
}

export async function resolveDlqJobAdmin(id: string) {
  return request<any>(`/admin/jobs/dlq/${id}/resolve`, {
    method: 'POST',
  });
}

export async function processOutboxAdmin(batchSize?: number) {
  const qs = batchSize ? `?batchSize=${batchSize}` : '';
  return request<any>(`/admin/jobs/outbox/process${qs}`, {
    method: 'POST',
  });
}

export async function replayEventsAdmin(payload: { fromTimestamp: string; eventTypes?: string[] }) {
  return request<any>('/admin/events/replay', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function flushCacheAdmin() {
  return request<any>('/admin/cache/flush', {
    method: 'POST',
  });
}

export async function invalidateCacheAdmin(pattern: string) {
  return request<any>('/admin/cache/invalidate', {
    method: 'POST',
    body: JSON.stringify({ pattern }),
  });
}

export async function exportUserDataAdmin(userId: string) {
  return request<any>(`/admin/data-platform/export/${userId}`);
}

export async function anonymizeUserDataAdmin(userId: string) {
  return request<any>(`/admin/data-platform/anonymize/${userId}`, {
    method: 'POST',
  });
}

export async function runRetentionPoliciesAdmin() {
  return request<any>('/admin/data-platform/retention/run', {
    method: 'POST',
  });
}

export async function getPartitionDdlAdmin(year?: number, month?: number) {
  const qs = new URLSearchParams();
  if (year) qs.append('year', String(year));
  if (month) qs.append('month', String(month));
  return request<{ year: number; month: number; ddl: string[] }>(
    `/admin/data-platform/partitions/ddl?${qs.toString()}`,
  );
}

// ==========================================
// PHASE 15: AI, RISK, FRAUD & INTELLIGENCE
// ==========================================

export async function getRiskEntitiesAdmin(params?: {
  entityType?: string;
  riskLevel?: string;
  isResolved?: boolean;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.append('entityType', params.entityType);
  if (params?.riskLevel) qs.append('riskLevel', params.riskLevel);
  if (params?.isResolved !== undefined) qs.append('isResolved', String(params.isResolved));
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  return request<any>(`/admin/risk/entities?${qs.toString()}`);
}

export async function getEntityRiskAdmin(entityType: string, entityId: string) {
  return request<any[]>(`/admin/risk/${entityType}/${entityId}`);
}

export async function reviewEntityRiskAdmin(
  entityType: string,
  entityId: string,
  data: { isResolved: boolean; decision: string; resolutionNotes?: string },
) {
  return request<any>(`/admin/risk/${entityType}/${entityId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getIntelligenceOverviewAdmin() {
  return request<any>('/admin/intelligence/overview');
}

export async function getLocalityIntelligenceAdmin() {
  return request<any[]>('/admin/intelligence/localities');
}

export async function getFraudTrendsAdmin() {
  return request<any[]>('/admin/intelligence/fraud');
}

export async function getModerationRecordsAdmin(params?: {
  flag?: string;
  actionTaken?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.flag) qs.append('flag', params.flag);
  if (params?.actionTaken) qs.append('actionTaken', params.actionTaken);
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  return request<any>(`/admin/moderation/records?${qs.toString()}`);
}

export async function reviewModerationRecordAdmin(
  id: string,
  reviewerAction: 'APPROVED' | 'BLOCKED' | 'DISMISSED',
) {
  return request<any>(`/admin/moderation/records/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewerAction }),
  });
}

export async function getSeoHealthReportAdmin() {
  return request<any>('/growth/admin/seo-health');
}

export async function triggerSitemapRegenerateAdmin() {
  return request<any>('/growth/seo/sitemap.xml');
}

// ==========================================
// PHASE 20: COMMERCIALIZATION & GROWTH ADMIN
// ==========================================

export async function getLeadsAdmin(params?: {
  status?: string;
  leadType?: string;
  source?: string;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.append('status', params.status);
  if (params?.leadType) qs.append('leadType', params.leadType);
  if (params?.source) qs.append('source', params.source);
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  return request<any>(`/monetization/admin/leads?${qs.toString()}`);
}

export async function updateLeadStatusAdmin(
  leadId: string,
  payload: { status: string; reason?: string },
) {
  return request<any>(`/monetization/admin/leads/${leadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function logContactAttemptAdmin(
  leadId: string,
  payload: { channel: string; successful: boolean; notes?: string },
) {
  return request<any>(`/monetization/admin/leads/${leadId}/contact`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function assignLeadAdmin(leadId: string, payload: { assignedToId: string }) {
  return request<any>(`/monetization/admin/leads/${leadId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addLeadNoteAdmin(leadId: string, payload: { note: string }) {
  return request<any>(`/monetization/admin/leads/${leadId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCampaignsAdmin(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<any>(`/monetization/admin/campaigns${qs}`);
}

export async function createCampaignAdmin(payload: any) {
  return request<any>('/monetization/admin/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSubscriptionsAdmin(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<any>(`/monetization/admin/subscriptions${qs}`);
}

export async function getAdminInvoices(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return request<any>(`/monetization/admin/invoices${qs}`);
}

export async function refundInvoiceAdmin(
  invoiceId: string,
  payload: { reason: string; amount?: number },
) {
  return request<any>(`/monetization/admin/invoices/${invoiceId}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCommercialOverviewAdmin() {
  return request<any>('/monetization/admin/overview');
}

export async function createPromoCodeAdmin(payload: any) {
  return request<any>('/monetization/admin/promo-codes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
