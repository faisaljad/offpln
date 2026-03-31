import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getToken() {
  return SecureStore.getItemAsync('access_token');
}

async function getRefreshToken() {
  return SecureStore.getItemAsync('refresh_token');
}

async function tryRefreshTokens(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const data = json?.data ?? json;
  if (!data?.accessToken) return null;

  await SecureStore.setItemAsync('access_token', data.accessToken);
  if (data.refreshToken) {
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
  }
  return data.accessToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const makeHeaders = (token?: string | null) => ({
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  let token = requiresAuth ? await getToken() : null;

  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...options,
    headers: makeHeaders(token),
  });

  // On 401, try to refresh once and retry
  if (res.status === 401 && requiresAuth) {
    const newToken = await tryRefreshTokens();
    if (newToken) {
      const retryRes = await fetch(`${BASE_URL}/api/v1${path}`, {
        ...options,
        headers: makeHeaders(newToken),
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) throw new Error(retryData?.message || 'Request failed');
      return retryData?.data ?? retryData;
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data?.data ?? data;
}

export const api = {
  // Auth
  sendRegisterOtp: (email: string) =>
    request('/auth/register/send-otp', { method: 'POST', body: JSON.stringify({ email }) }, false),
  register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }, false),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }, false),
  verifyLoginOtp: (email: string, code: string) =>
    request('/auth/verify-login-otp', { method: 'POST', body: JSON.stringify({ email, code }) }, false),
  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, false),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }, false),

  // Properties
  getEmirates: () => request<any[]>('/properties/emirates', {}, false),
  getProperties: (params?: Record<string, any>) => {
    const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/properties${q}`, {}, false);
  },
  getProperty: (id: string) => request(`/properties/${id}`, {}, false),

  // Investments
  createInvestment: (body: any) => request('/investments', { method: 'POST', body: JSON.stringify(body) }),
  getMyInvestments: (params?: any) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/investments/my${q}`);
  },
  getInvestment: (id: string) => request(`/investments/${id}`),

  // Share Transfers
  createTransfer: (body: { investmentId: string; askPrice: number; notes?: string }) =>
    request('/transfers', { method: 'POST', body: JSON.stringify(body) }),
  cancelTransfer: (id: string) =>
    request(`/transfers/${id}/cancel`, { method: 'PUT' }),
  getMarketplace: () => request('/transfers/marketplace'),
  buyTransfer: (id: string) =>
    request(`/transfers/${id}/buy`, { method: 'POST' }),
  getMyTransfers: () => request('/transfers/my'),
  getTransfer: (id: string) => request(`/transfers/${id}`),
  confirmTransfer: (id: string, code: string) =>
    request(`/transfers/${id}/confirm`, { method: 'POST', body: JSON.stringify({ code }) }),
  resendTransferOtp: (id: string) =>
    request(`/transfers/${id}/resend-otp`, { method: 'POST' }),

  // Settings
  getSettings: () => request('/settings', {}, false),

  // Payout summary (anonymized)
  getPayoutSummary: (propertyId: string) => request(`/properties/${propertyId}/payout-summary`, {}, true),

  // OTP auth
  sendOtp: (target: string, channel: 'email' | 'sms' | 'whatsapp') =>
    request('/auth/otp/send', { method: 'POST', body: JSON.stringify({ target, channel }) }, false),
  verifyOtp: (target: string, code: string) =>
    request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ target, code }) }, false),

  // Payments
  getUpcomingPayments: () => request('/payments/upcoming'),
  getMyPayments: () => request('/payments/my'),
  uploadPaymentProof: async (fileUri: string, fileName: string, mimeType: string): Promise<string> => {
    const token = await getToken();
    const form = new FormData();
    form.append('files', { uri: fileUri, name: fileName, type: mimeType } as any);
    const res = await fetch(`${BASE_URL}/api/v1/payments/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || 'Upload failed');
    const urls: string[] = (json?.data ?? json)?.urls ?? [];
    if (!urls[0]) throw new Error('No URL returned from upload');
    return urls[0];
  },
  submitPaymentProof: (paymentId: string, proofUrl: string) =>
    request(`/payments/${paymentId}/proof`, { method: 'PATCH', body: JSON.stringify({ proofUrl }) }),

  // User
  getProfile: () => request('/user/profile'),
  updateProfile: (body: any) => request('/user/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  getBankDetails: () => request('/user/bank-details'),
  updateBankDetails: (body: any) => request('/user/bank-details', { method: 'PUT', body: JSON.stringify(body) }),

  // Notifications
  getNotifications: (page: number) => request('/notifications?page=' + page + '&limit=20'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id: string) => request('/notifications/' + id + '/read', { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),
  getNotificationPrefs: () => request('/notifications/preferences'),
  updateNotificationPrefs: (prefs: Record<string, boolean>) => request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),
  registerPushToken: (token: string) => request('/notifications/push-token', { method: 'POST', body: JSON.stringify({ token }) }),
};
