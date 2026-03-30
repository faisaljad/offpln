import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  try {
    const settings = await apiFetch('/settings', { token });
    return { settings };
  } catch (err: any) {
    if (err.status === 401) throw redirect(302, '/login');
    return { settings: {} };
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const fd = await request.formData();

    const commissions: Record<string, any> = {};
    const fields = [
      'investmentCommission',
      'soldCommission',
      'transferCommission',
      'paymentDelayFee',
      'paymentDefaultFee',
    ];

    for (const field of fields) {
      const type = fd.get(`${field}_type`) as string;
      const value = parseFloat(fd.get(`${field}_value`) as string);
      if (type && !isNaN(value)) {
        commissions[field] = { type, value };
      } else {
        commissions[field] = null;
      }
    }

    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(commissions),
        token,
      });
      return { success: true };
    } catch (err: any) {
      return fail(500, { error: err.message || 'Failed to save' });
    }
  },
};
