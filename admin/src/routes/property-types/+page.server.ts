import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  try {
    const propertyTypes = await apiFetch('/admin/property-types', { token });
    return { propertyTypes };
  } catch (err: any) {
    if (err.status === 401) throw redirect(302, '/login');
    return { propertyTypes: [] };
  }
};

export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const formData = await request.formData();
    const name = formData.get('name')?.toString()?.trim();

    if (!name) {
      return fail(400, { error: 'Name is required' });
    }

    try {
      await apiFetch('/admin/property-types', {
        token,
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    } catch (err: any) {
      return fail(err.status || 500, { error: err.message });
    }

    return { success: true };
  },

  delete: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'ID is required' });
    }

    try {
      await apiFetch(`/admin/property-types/${id}`, {
        token,
        method: 'DELETE',
      });
    } catch (err: any) {
      return fail(err.status || 500, { error: err.message });
    }

    return { success: true };
  },
};
