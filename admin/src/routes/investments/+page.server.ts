import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';
import { guardedLoad } from '$lib/utils/load';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');
  return guardedLoad(async () => {
    const page = url.searchParams.get('page') || '1';
    const status = url.searchParams.get('status') || '';
    const data = await apiFetch(
      `/admin/investments?page=${page}&limit=15${status ? `&status=${status}` : ''}`,
      { token },
    );
    return { ...data, statusFilter: status };
  });
};

export const actions: Actions = {
  approve: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const data = await request.formData();
    try {
      await apiFetch(`/admin/investments/${data.get('id')}/status`, {
        method: 'PATCH', token, body: JSON.stringify({ status: 'APPROVED' }),
      });
      return { success: true };
    } catch (err: any) { return fail(500, { error: err.message }); }
  },
  reject: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const data = await request.formData();
    try {
      await apiFetch(`/admin/investments/${data.get('id')}/status`, {
        method: 'PATCH', token, body: JSON.stringify({ status: 'REJECTED' }),
      });
      return { success: true };
    } catch (err: any) { return fail(500, { error: err.message }); }
  },
};
