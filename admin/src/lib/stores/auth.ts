import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AuthState {
  token: string | null;
  user: { id: string; name: string; email: string; role: string; permissions?: string[] } | null;
}

const initial: AuthState = {
  token: browser ? localStorage.getItem('admin_token') : null,
  user: browser
    ? JSON.parse(localStorage.getItem('admin_user') || 'null')
    : null,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initial);

  return {
    subscribe,
    setAuth(token: string, user: AuthState['user']) {
      if (browser) {
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(user));
      }
      set({ token, user });
    },
    clearAuth() {
      if (browser) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
      set({ token: null, user: null });
    },
  };
}

export const auth = createAuthStore();
