import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  return guardedLoad(async () => {
    const page = url.searchParams.get('page') || '1';
    const search = url.searchParams.get('search') || '';
    const data = await apiFetch(
      `/admin/properties?page=${page}&limit=10${search ? `&search=${search}` : ''}`,
      { token },
    );
    return { ...data, search };
  });
};

export const actions: Actions = {
  delete: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const data = await request.formData();
    const id = data.get('id') as string;
    try {
      await apiFetch(`/admin/properties/${id}`, { method: 'DELETE', token });
      return { success: true };
    } catch (err: any) {
      return fail(500, { error: err.message });
    }
  },
};
