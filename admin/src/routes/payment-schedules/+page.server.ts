import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  const status = url.searchParams.get('status') ?? '';

  return guardedLoad(async () => {
    const [stats, payments] = await Promise.all([
      apiFetch('/admin/payment-schedules/stats', { token }),
      apiFetch(`/admin/payment-schedules?status=${status}`, { token }),
    ]);
    return { stats, payments, currentStatus: status };
  });
};
