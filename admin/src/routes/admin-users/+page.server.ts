import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  try {
    const admins = await apiFetch('/admin/users/admins', { token });
    return { admins };
  } catch (err: any) {
    if (err.status === 401) throw redirect(302, '/login');
    return { admins: [] };
  }
};

export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!name || !email || !password) {
      return fail(400, { error: 'Name, email, and password are required' });
    }

    try {
      await apiFetch('/admin/users/admins', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        token,
      });
      return { success: true, message: 'Admin user created successfully' };
    } catch (err: any) {
      return fail(err.status || 500, { error: err.message || 'Failed to create admin user' });
    }
  },

  changePassword: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const formData = await request.formData();
    const id = formData.get('id') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!id || !newPassword) {
      return fail(400, { error: 'ID and new password are required' });
    }

    try {
      await apiFetch(`/admin/users/admins/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
        token,
      });
      return { success: true, message: 'Password changed successfully' };
    } catch (err: any) {
      return fail(err.status || 500, { error: err.message || 'Failed to change password' });
    }
  },

  delete: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return fail(400, { error: 'User ID is required' });
    }

    try {
      await apiFetch(`/admin/users/admins/${id}`, {
        method: 'DELETE',
        token,
      });
      return { success: true, message: 'Admin user deleted successfully' };
    } catch (err: any) {
      return fail(err.status || 500, { error: err.message || 'Failed to delete admin user' });
    }
  },
};
