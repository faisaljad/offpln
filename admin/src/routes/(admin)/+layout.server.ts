import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  const token = cookies.get('admin_token');
  if (!token && url.pathname !== '/login') {
    throw redirect(302, '/login');
  }
  const userStr = cookies.get('admin_user');
  let user = null;
  try { user = userStr ? JSON.parse(userStr) : null; } catch {}
  return { token, user };
};
