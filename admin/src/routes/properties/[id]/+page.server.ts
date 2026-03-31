import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies, params }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  const [property, investments, payouts, settings] = await Promise.all([
    apiFetch(`/admin/properties/${params.id}`, { token }),
    apiFetch(`/admin/investments?propertyId=${params.id}&limit=50`, { token }),
    apiFetch(`/admin/properties/${params.id}/payouts`, { token }).catch(() => []),
    apiFetch('/settings', { token }).catch(() => ({})),
  ]);

  return { property, investments: investments.investments ?? [], payouts: payouts ?? [], settings };
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
  setMilestone: async ({ request, cookies, params }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const milestone = fd.get('milestone') as string;
    try {
      await adminFetch(`/admin/properties/${params.id}/milestone`, token!, 'PUT', { milestone });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to update milestone' });
    }
    return { success: true, action: 'milestone' };
  },
  setSold: async ({ request, cookies, params }) => {
    const token = cookies.get('admin_token');
    const fd = await request.formData();
    const sellingPrice = parseFloat(fd.get('sellingPrice') as string);
    const originalSellingPrice = parseFloat(fd.get('originalSellingPrice') as string) || undefined;
    if (!sellingPrice || sellingPrice <= 0) {
      return fail(400, { error: 'Please enter a valid selling price' });
    }
    try {
      await adminFetch(`/admin/properties/${params.id}/sold`, token!, 'PUT', { sellingPrice, originalSellingPrice });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to mark as sold' });
    }
    return { success: true, action: 'sold' };
  },
  markPaid: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const file = fd.get('receipt') as File | null;

    let receiptUrl: string | undefined;

    // Upload receipt file if provided
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
        receiptUrl = urls[0];
      } catch {
        return fail(500, { error: 'Failed to upload receipt file' });
      }
    }

    try {
      await adminFetch(`/admin/payouts/${id}/paid`, token!, 'PUT', { receiptUrl });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to mark as paid' });
    }
    return { success: true, action: 'paid' };
  },
};
