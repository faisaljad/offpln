import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const actions: Actions = {
  login: async ({ request, fetch }) => {
    const data = Object.fromEntries(await request.formData());
    const result = LoginSchema.safeParse(data);

    if (!result.success) {
      return fail(400, { error: 'Invalid email or password format', email: data.email as string });
    }

    try {
      const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      const json = await res.json();

      if (!res.ok) {
        return fail(401, { error: json?.message || 'Invalid credentials', email: result.data.email });
      }

      const responseData = json.data;

      // OTP required — return email for step 2
      if (responseData.otpRequired) {
        return {
          otpRequired: true,
          email: responseData.email,
          password: result.data.password,
        };
      }

      // Direct login (shouldn't happen now, but fallback)
      return fail(500, { error: 'Unexpected response', email: result.data.email });
    } catch (err) {
      return fail(500, { error: 'Connection error. Please try again.', email: data.email as string });
    }
  },

  verifyOtp: async ({ request, cookies, fetch }) => {
    const data = Object.fromEntries(await request.formData());
    const email = data.email as string;
    const code = data.code as string;

    if (!email || !code || code.length !== 6) {
      return fail(400, { error: 'Please enter the 6-digit code', otpRequired: true, email });
    }

    try {
      const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/v1/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const json = await res.json();

      if (!res.ok) {
        return fail(401, { error: json?.message || 'Invalid code', otpRequired: true, email });
      }

      const { accessToken, user } = json.data;

      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return fail(403, { error: 'Access denied. Admin only.', email });
      }

      const isProduction = !!env.VERCEL || env.NODE_ENV === 'production';

      cookies.set('admin_token', accessToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      cookies.set('admin_user', JSON.stringify(user), {
        path: '/',
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      cookies.set('admin_role', user.role, {
        path: '/',
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      cookies.set('admin_perms', (user.permissions || []).join(','), {
        path: '/',
        httpOnly: false,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch (err) {
      return fail(500, { error: 'Connection error. Please try again.', otpRequired: true, email: data.email as string });
    }

    throw redirect(302, '/dashboard');
  },

  resendOtp: async ({ request, fetch }) => {
    const data = Object.fromEntries(await request.formData());
    const email = data.email as string;
    const password = data.password as string;

    try {
      const apiUrl = env.BACKEND_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return { otpRequired: true, email, password, resent: true };
    } catch {
      return fail(500, { error: 'Failed to resend code', otpRequired: true, email });
    }
  },
};
