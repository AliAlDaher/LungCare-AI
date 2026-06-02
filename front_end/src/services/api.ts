// API client

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5174').replace(/\/$/, '');

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  // Build query string if parameters are supplied
  let queryString = '';
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const parsed = searchParams.toString();
    if (parsed) {
      queryString = `?${parsed}`;
    }
  }

  // Construct absolute URL
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${path}${queryString}`;

  // Assemble defaults
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Inject Bearer Authorization header automatically if active session exists
  const token = localStorage.getItem('lungcare_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Execute request
  const res = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...restOptions,
  });

  if (!res.ok) {
    let errMsg = `API error: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      errMsg = errData.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json() as Promise<T>;
}
