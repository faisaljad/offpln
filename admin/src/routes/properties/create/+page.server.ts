import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import { apiFetch } from '$lib/utils/api';
import { z } from 'zod';

const PropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  location: z.string().min(2),
  developer: z.string().optional(),
  developerLogo: z.string().optional(),
  originalPrice: z.coerce.number().positive(),
  totalPrice: z.coerce.number().positive(),
  totalShares: z.coerce.number().int().positive(),
  roi: z.coerce.number().min(0),
  profitType: z.enum(['SELLS_AT_PROFIT', 'PRICE_INCREASE']).default('SELLS_AT_PROFIT'),
  status: z.enum(['ACTIVE', 'COMING_SOON', 'SOLD_OUT']).default('ACTIVE'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const load: PageServerLoad = async ({ cookies }) => {
  const token = cookies.get('admin_token');
  if (!token) throw redirect(302, '/login');

  let propertyTypes: any[] = [];
  let emirates: any[] = [];
  try {
    [propertyTypes, emirates] = await Promise.all([
      apiFetch('/admin/property-types', { token }).catch(() => []),
      apiFetch('/admin/emirates', { token }).catch(() => []),
    ]);
  } catch {
    // ignore — dropdowns will just be empty
  }

  return { propertyTypes, emirates };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const token = cookies.get('admin_token');
    const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
    const formData = await request.formData();

    const raw = Object.fromEntries(formData.entries());
    const paymentPlanRaw = raw.paymentPlan as string;

    // Images were already uploaded client-side; just collect the URLs
    const images = formData.getAll('images').map(String).filter(Boolean);

    // Strip non-serializable values before returning on failure
    const values = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => !(v instanceof File)),
    );

    const result = PropertySchema.safeParse(raw);
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors, values });
    }

    let paymentPlan: any;
    try {
      paymentPlan = JSON.parse(paymentPlanRaw || '{}');
    } catch {
      return fail(400, { errors: { paymentPlan: ['Invalid JSON'] }, values });
    }

    try {
      const area = raw.area ? Number(raw.area) : undefined;
      const handoverDate = raw.handoverDate?.toString() || undefined;
      const propertyTypeId = raw.propertyTypeId?.toString() || undefined;

      const res = await fetch(`${apiUrl}/api/v1/admin/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...result.data, images, paymentPlan, area, handoverDate, propertyTypeId }),
      });

      const json = await res.json();
      if (!res.ok) return fail(res.status, { error: json.message ?? json.data?.message, values });
    } catch (err: any) {
      return fail(500, { error: err.message, values });
    }

    throw redirect(302, '/properties');
  },
};
