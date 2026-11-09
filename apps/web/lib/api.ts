import {
  PropertySummaryDto,
  LocalityDto,
  TenantType,
  PropertyType,
  InquiryResponseDto,
  ReportReason,
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
