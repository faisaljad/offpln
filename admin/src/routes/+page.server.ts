import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (token) throw redirect(302, '/dashboard');
  throw redirect(302, '/login');
};
