import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  const payments = await apiFetch('/admin/payments/review', { token }).catch(() => []);
  return { payments };
};

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

export const actions: Actions = {
  approve: async ({ request, cookies }) => {
    const token  = cookies.get('admin_token')!;
    const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
    const fd     = await request.formData();
    const id     = fd.get('id') as string;
    const file   = fd.get('proof') as File | null;

    let proofUrl: string | undefined;

    if (file && file.size > 0) {
      try {
        const uploadForm = new FormData();
        uploadForm.append('files', file);
        const upRes = await fetch(`${apiUrl}/api/v1/admin/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        });
        const upJson = await upRes.json();
        const urls: string[] = upJson?.data?.urls ?? upJson?.urls ?? [];
        proofUrl = urls[0];
      } catch {
        return fail(500, { error: 'Failed to upload proof file' });
      }
    }

    try {
      await adminFetch(`/admin/payments/${id}/approve`, token, 'PATCH', { proofUrl });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to approve payment' });
    }
    return { success: true, action: 'approve' };
  },

  reject: async ({ request, cookies }) => {
    const token = cookies.get('admin_token')!;
    const fd    = await request.formData();
    const id    = fd.get('id') as string;
    try {
      await adminFetch(`/admin/payments/${id}/reject`, token, 'PATCH');
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to reject payment' });
    }
    return { success: true, action: 'reject' };
  },
};
