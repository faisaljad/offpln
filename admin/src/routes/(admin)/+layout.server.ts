import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token && url.pathname !== '/login') {
    throw redirect(302, '/login');
  }

  // Read user from JSON cookie
  const userStr = cookies.get('admin_user');
  let user: any = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch {}

  // Fallback: read role/permissions from simple cookies
  const role = cookies.get('admin_role') || user?.role || 'ADMIN';
  const permsStr = cookies.get('admin_perms') || '';
  const permissions = permsStr ? permsStr.split(',') : (user?.permissions || []);

  return {
    token,
    user: user ? { ...user, role, permissions } : { role, permissions },
  };
};
