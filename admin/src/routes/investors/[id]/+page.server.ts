import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies, params }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  return guardedLoad(async () => {
    const [user, investments] = await Promise.all([
      apiFetch(`/admin/users/${params.id}`, { token }),
      apiFetch(`/admin/investments?userId=${params.id}&limit=50`, { token }),
    ]);
    return { user, investments: investments.investments ?? [] };
  });
};
