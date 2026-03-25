import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw error(401, 'Unauthorized');

  const formData = await request.formData();
  const apiUrl = env.BACKEND_URL || 'http://localhost:3000';

  const proxyForm = new FormData();
  for (const [key, value] of formData.entries()) {
    proxyForm.append(key, value);
  }

  const res = await fetch(`${apiUrl}/api/v1/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: proxyForm,
  });

  const data = await res.json();
  if (!res.ok) throw error(res.status, data.message);

  return json(data.data);
};
