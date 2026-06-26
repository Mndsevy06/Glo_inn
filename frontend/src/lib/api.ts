const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Erreur réseau.' }));
    const err: any = new Error(body.message || 'Erreur serveur.');
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  updateSettings: (data: { theme?: string; currency?: string }) =>
    request<{ message: string; user: any }>('/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export type UserRole = 'client' | 'receptionniste' | 'gerant';

export interface ApiUser {
  id: string;
  nom: string;
  telephone: string;
  adresse?: string;
  role: UserRole;
  username: string;
  actif: boolean;
  createdAt: string;
}

export interface UserStats {
  total: number;
  clients: number;
  gerants: number;
  receptionnistes: number;
  actifs: number;
  inactifs: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersListResponse {
  users: ApiUser[];
  pagination: PaginationInfo;
}

export const usersApi = {
  getStats: (): Promise<UserStats> => request('/users/stats'),

  getAll: (params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UsersListResponse> => {
    const qs = new URLSearchParams();
    if (params?.role && params.role !== 'all') qs.set('role', params.role);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request(`/users?${qs.toString()}`);
  },

  getById: (id: string): Promise<ApiUser> => request(`/users/${id}`),

  create: (data: {
    nom: string;
    telephone: string;
    adresse?: string;
    role: UserRole;
    username: string;
    password: string;
  }): Promise<{ message: string; user: ApiUser }> =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (
    id: string,
    data: Partial<{ nom: string; telephone: string; adresse: string; role: UserRole; username: string }>
  ): Promise<{ message: string; user: ApiUser }> =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/users/${id}`, { method: 'DELETE' }),

  toggleActive: (id: string): Promise<{ message: string; user: { id: string; actif: boolean; nom: string } }> =>
    request(`/users/${id}/toggle-active`, { method: 'PATCH' }),

  resetPassword: (
    id: string,
    newPassword: string
  ): Promise<{ message: string }> =>
    request(`/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  getKpis: (period: number) =>
    request<any>(`/reports/kpis?period=${period}`),
  getDaily: () =>
    request<any[]>('/reports/daily'),
  getMonthly: () =>
    request<any[]>('/reports/monthly'),
  getPayments: (period: number) =>
    request<any[]>(`/reports/payments?period=${period}`),
  getServices: (period: number) =>
    request<any[]>(`/reports/services?period=${period}`),
  getHourly: () =>
    request<any[]>('/reports/hourly'),
  getPerformance: (period: number) =>
    request<any[]>(`/reports/performance?period=${period}`),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => request<any>('/dashboard/stats'),
};

// ─── Services ────────────────────────────────────────────────────────────────
export interface ApiService {
  id: string;
  libelle: string;
  description: string;
  image: string | null;
  tarif_unitaire: string;
  categorie: string;
  actif: boolean;
  express_disponible: boolean;
  tarif_express: string | null;
}

export const servicesApi = {
  getAll: () => request<ApiService[]>('/services'),
  getAllAdmin: () => request<ApiService[]>('/services/admin'),

  create: async (data: FormData): Promise<{ message: string; service: ApiService }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la requête');
    }
    return res.json();
  },

  update: async (id: string, data: FormData): Promise<{ message: string; service: ApiService }> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: data,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur lors de la requête');
    }
    return res.json();
  },

  updateStatus: (id: string, data: { actif: boolean }): Promise<{ message: string; service: ApiService }> =>
    request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string): Promise<{ message: string }> =>
    request(`/services/${id}`, { method: 'DELETE' }),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: {
    clientId?: string;
    newClient?: { nom: string; telephone: string; adresse?: string; username?: string; password?: string };
    cart: { serviceId: string; quantite: number; type: 'Normal' | 'Express'; note: string }[];
    expectedDate?: string;
  }) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => request<any[]>('/orders'),
  updateStatus: (id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updatePayment: (id: string) => request<any>(`/orders/${id}/payment`, { method: 'PATCH' }),
  sendReminder: (id: string) => request<any>(`/orders/${id}/remind`, { method: 'POST' }),
};

// ─── Client ──────────────────────────────────────────────────────────────────
export const clientApi = {
  getOrders: () => request<any[]>('/client/orders'),
  getNotifications: () => request<any[]>('/client/notifications'),
  markNotificationRead: (id: string) => request<any>(`/client/notifications/${id}/read`, { method: 'PATCH' }),
};

// ─── Payments (PawaPay Mobile Money) ─────────────────────────────────────────
export const paymentsApi = {
  // PawaPay (Legacy/Alternative)
  initiate: (data: { id_facture: string; telephone: string }) =>
    request<{ message: string; depositId: string; operateur: string }>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkStatus: (depositId: string) =>
    request<any>(`/payments/status/${depositId}`),
    
  // Netikash (Redirect flow)
  initiateNetikash: (data: { id_facture: string }) =>
    request<{ message: string; link: string; requestId: string; paiement: any }>('/payments/netikash/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  checkNetikashStatus: (requestId: string) =>
    request<any>(`/payments/netikash/status/${requestId}`),
};

// ─── Configuration ────────────────────────────────────────────────────────────
export const configApi = {
  get: () => request<{ id: string; taux_echange: string | number }>('/config'),
  update: (taux_echange: number) =>
    request<{ id: string; taux_echange: string | number }>('/config', {
      method: 'PUT',
      body: JSON.stringify({ taux_echange }),
    }),
};
