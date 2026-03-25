import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const BulkPropertySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  totalPrice: z.coerce.number().positive(),
  totalShares: z.coerce.number().int().positive(),
  roi: z.coerce.number().min(0),
  images: z
    .string()
    .transform((v) => v.split(',').map((s) => s.trim()))
    .or(z.array(z.string())),
  paymentPlanJSON: z
    .string()
    .transform((v) => JSON.parse(v))
    .catch({}),
});

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) throw error(400, 'No file provided');

  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim());
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

  const validated: any[] = [];
  const errors: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const result = BulkPropertySchema.safeParse(row);
    if (result.success) {
      validated.push({
        ...result.data,
        paymentPlan: result.data.paymentPlanJSON,
      });
    } else {
      errors.push({ row: i + 1, errors: result.error.flatten() });
    }
  }

  return json({ validated, errors, total: lines.length - 1 });
};
