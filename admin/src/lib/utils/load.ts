import { redirect } from '@sveltejs/kit';

/** Wraps a server load body — redirects to /login on 401, re-throws everything else */
export async function guardedLoad<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.status === 401) throw redirect(302, '/login');
    throw err;
  }
}
