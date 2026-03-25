import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, accessToken, refreshToken });
  },

  clearAuth: async () => {
    // Keep refresh_token and user so biometric login works after logout
    await SecureStore.deleteItemAsync('access_token');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        set({
          accessToken: token,
          user: JSON.parse(userStr),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
