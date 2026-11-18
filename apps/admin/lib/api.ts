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
