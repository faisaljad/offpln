import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const role = cookies.get('admin_role') || '';
  const permsStr = cookies.get('admin_perms') || '';
  const permissions = permsStr ? permsStr.split(',') : [];

  // Fallback: try parsing admin_user cookie
  let user: any = null;
  const userStr = cookies.get('admin_user');
  try { user = userStr ? JSON.parse(userStr) : null; } catch {}

  return {
    currentUser: {
      name: user?.name || '',
      email: user?.email || '',
      role: role || user?.role || '',
      permissions: permissions.length ? permissions : (user?.permissions || []),
    },
  };
};
