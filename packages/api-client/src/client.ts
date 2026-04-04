export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

declare const process: { env: { NEXT_PUBLIC_API_URL?: string } };

function getBaseUrl(): string {
  try {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';
  } catch {
    return 'https://api.mulligans.uk.com';
  }
}

// Token provider — injected by the app at startup
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(provider: () => Promise<string | null>): void {
  tokenProvider = provider;
}

async function getAuthToken(): Promise<string | null> {
  if (tokenProvider) return tokenProvider();
  // Fallback to localStorage for backwards compatibility
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mulligans_auth_token');
  }
  return null;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  const baseUrl = getBaseUrl();
  let url = `${baseUrl}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const token = await getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let data: unknown;
    try { data = await response.json(); } catch { /* not JSON */ }
    throw new ApiError(response.status, response.statusText, data);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mulligans_auth_token', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mulligans_auth_token');
  }
}