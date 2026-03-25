import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  return guardedLoad(async () => {
    const stats = await apiFetch('/admin/dashboard', { token });
    return { stats };
  });
};
