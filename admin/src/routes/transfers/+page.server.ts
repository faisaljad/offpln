import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

async function adminFetch(path: string, token: string, method = 'GET', body?: any) {
  const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${apiUrl}/api/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw { status: res.status, message: json.message };
  return json?.data ?? json;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  const status = url.searchParams.get('status') || '';
  const q = status ? `?status=${status}` : '';

  try {
    const transfers = await adminFetch(`/transfers/admin/all${q}`, token);
    return { transfers, status };
  } catch (err: any) {
    if (err.status === 401) throw redirect(302, '/login');
    return { transfers: [], status };
  }
};

export const actions: Actions = {
  approveListing: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const id = fd.get('id') as string;
    try {
      await adminFetch(`/transfers/admin/${id}/approve-listing`, token!, 'PUT');
    } catch (err: any) {
      return { error: err.message || 'Failed to approve listing' };
    }
    return { success: true, action: 'listing approved' };
  },
  approve: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const id = fd.get('id') as string;
    try {
      await adminFetch(`/transfers/admin/${id}/approve`, token!, 'PUT');
    } catch (err: any) {
      return { error: err.message || 'Failed to approve' };
    }
    return { success: true, action: 'transfer approved — OTP sent to seller' };
  },
  reject: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const note = fd.get('note') as string | null;
    try {
      await adminFetch(`/transfers/admin/${id}/reject`, token!, 'PUT', { note: note || undefined });
    } catch (err: any) {
      return { error: err.message || 'Failed to reject' };
    }
    return { success: true, action: 'listing rejected' };
  },
  rejectRequest: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const note = fd.get('note') as string | null;
    try {
      await adminFetch(`/transfers/admin/${id}/reject-request`, token!, 'PUT', { note: note || undefined });
    } catch (err: any) {
      return { error: err.message || 'Failed to reject request' };
    }
    return { success: true, action: 'buy request rejected — listing restored' };
  },
};
