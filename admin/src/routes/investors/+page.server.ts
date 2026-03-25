import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  return guardedLoad(async () => {
    const page = url.searchParams.get('page') || '1';
    const search = url.searchParams.get('search') || '';
    const data = await apiFetch(
      `/admin/users?page=${page}&limit=15${search ? `&search=${search}` : ''}`,
      { token },
    );
    return { ...data, search };
  });
};
