import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  const status = url.searchParams.get('status') || '';
  const query = status ? `?status=${status}` : '';

  const [stats, payouts] = await Promise.all([
    apiFetch('/admin/payouts/stats', { token }).catch(() => ({
      totalPending: 0,
      totalPaid: 0,
      pendingAmount: 0,
      paidAmount: 0,
    })),
    apiFetch(`/admin/payouts${query}`, { token }).catch(() => []),
  ]);

  return { stats, payouts, status };
};

export const actions: Actions = {
  markPaid: async ({ request, cookies }) => {
    const token = cookies.get('admin_token')!;
    const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
    const fd = await request.formData();
    const id = fd.get('id') as string;
    const file = fd.get('receipt') as File | null;

    let receiptUrl: string | undefined;

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
      const res = await fetch(`${apiUrl}/api/v1/admin/payouts/${id}/paid`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw { message: json.message };
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to mark payout as paid' });
    }

    return { success: true };
  },
};
