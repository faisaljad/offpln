import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw error(401, 'Unauthorized');

  const { properties } = await request.json();
  if (!properties?.length) throw error(400, 'No properties provided');

  const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
  const res = await fetch(`${apiUrl}/api/v1/admin/properties/bulk/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ properties }),
  });

  const data = await res.json();
  if (!res.ok) throw error(res.status, data.message);

  return json(data.data);
};
