import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  try {
    const settings = await apiFetch('/settings', { token });
    return { settings };
  } catch (err: any) {
    if (err.status === 401) throw redirect(302, '/login');
    return { settings: { termsAndConditions: '', paymentTransferDetails: '' } };
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
    const formData = await request.formData();

    const termsAndConditions = formData.get('termsAndConditions') as string;
    const paymentTransferDetails = formData.get('paymentTransferDetails') as string;
    const transferListingTerms = formData.get('transferListingTerms') as string;
    const transferBuyingTerms = formData.get('transferBuyingTerms') as string;

    try {
      const res = await fetch(`${apiUrl}/api/v1/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ termsAndConditions, paymentTransferDetails, transferListingTerms, transferBuyingTerms }),
      });
      const json = await res.json();
      if (!res.ok) return fail(res.status, { error: json.message ?? 'Failed to save' });
    } catch (err: any) {
      return fail(500, { error: err.message });
    }

    return { success: true };
  },
};
