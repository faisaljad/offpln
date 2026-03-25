import { env } from '$env/dynamic/private';

const API_URL = env.BACKEND_URL || 'http://localhost:3000';

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string } = {},
) {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_URL}/api/v1${path}`;
  const res = await fetch(url, { ...fetchOptions, headers });

  const data = await res.json();
  if (!res.ok) {
    console.error(`[apiFetch] ${res.status} ${url}`, JSON.stringify(data));
    const err: any = new Error(data?.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}

export const API_BASE = `${API_URL}/api/v1`;
