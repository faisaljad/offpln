import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetch } from '$lib/utils/api';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  const page = url.searchParams.get('page') || '1';

  const [notificationsData, usersData] = await Promise.all([
    apiFetch(`/admin/notifications?page=${page}`, { token }).catch(() => ({ notifications: [], total: 0, pages: 1 })),
    apiFetch('/admin/users', { token }).catch(() => ({ users: [] })),
  ]);

  return {
    notifications: notificationsData.notifications ?? [],
    total: notificationsData.total ?? 0,
    pages: notificationsData.pages ?? 1,
    currentPage: parseInt(page),
    users: usersData.users ?? usersData ?? [],
  };
};

export const actions: Actions = {
  broadcast: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const fd = await request.formData();
    const title = fd.get('title') as string;
    const body = fd.get('body') as string;

    if (!title || !body) return fail(400, { error: 'Title and body are required' });

    try {
      await apiFetch('/admin/notifications/broadcast', {
        token,
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to broadcast notification' });
    }

    return { success: true, action: 'broadcast' };
  },

  sendToUser: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    const fd = await request.formData();
    const userId = fd.get('userId') as string;
    const title = fd.get('title') as string;
    const body = fd.get('body') as string;

    if (!userId || !title || !body) return fail(400, { error: 'User, title, and body are required' });

    try {
      await apiFetch('/admin/notifications/send', {
        token,
        method: 'POST',
        body: JSON.stringify({ userId, title, body }),
      });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to send notification' });
    }

    return { success: true, action: 'sendToUser' };
  },

  triggerReminders: async ({ cookies }) => {
    const token = cookies.get('admin_token');
    if (!token) throw redirect(302, '/login');

    try {
      await apiFetch('/admin/notifications/trigger-payment-reminders', {
        token,
        method: 'POST',
      });
    } catch (err: any) {
      return fail(400, { error: err.message || 'Failed to trigger payment reminders' });
    }

    return { success: true, action: 'triggerReminders' };
  },
};
