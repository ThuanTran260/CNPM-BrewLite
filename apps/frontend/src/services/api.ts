import axios from 'axios';
import { ProductsResponse, Product } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn Bearer Token tự động từ localStorage vào mỗi request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('brewlite_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const productsApi = {
  getProducts: async (): Promise<ProductsResponse> => {
    const response = await apiClient.get<ProductsResponse>('/products');
    return response.data;
  },

  getProduct: async (id: string): Promise<Product & { options: ProductsResponse['options'] }> => {
    const response = await apiClient.get<Product & { options: ProductsResponse['options'] }>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  syncInventory: async (): Promise<{
    message: string;
    adjustedCount: number;
    adjustedProducts: Array<{
      id: string;
      name: string;
      oldStock: number;
      newStock: number;
      consumed: number;
    }>;
  }> => {
    const response = await apiClient.post('/products/sync-inventory');
    return response.data;
  },
};

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export interface RedeemedVoucher {
  code: string;
  type: string;
  value: number;
  minOrder: number;
  expiresAt: string | null;
}

export interface RedeemVoucherResponse {
  voucher: RedeemedVoucher;
  remainingPoints: number;
}

export type MyVoucher = RedeemedVoucher;

export const vouchersApi = {
  validateVoucher: async (code: string, subtotal: number) => {
    const response = await apiClient.post('/vouchers/validate', { code, subtotal });
    return response.data;
  },

  redeemVoucher: async (pointsCost: 20 | 50): Promise<RedeemVoucherResponse> => {
    const response = await apiClient.post<RedeemVoucherResponse>('/vouchers/redeem', { pointsCost });
    return response.data;
  },

  getMyVouchers: async (): Promise<MyVoucher[]> => {
    const response = await apiClient.get<MyVoucher[]>('/vouchers/my');
    return response.data;
  },
};

export const ordersApi = {
  createOrder: async (data: {
    items: Array<{ productId: string; size: string; toppings: string[]; qty: number }>;
    voucherCode?: string;
  }) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await apiClient.get('/orders/me');
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string) => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return response.data;
  },

  getStaffActiveOrders: async () => {
    const response = await apiClient.get('/orders/staff/active');
    return response.data;
  },

  updateOrderStatus: async (id: string, to: string) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { to });
    return response.data;
  },
};

export type AdminRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  loyaltyPoints: number;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
  description?: string;
  imageUrl?: string;
}

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>('/admin/users');
    return response.data;
  },

  updateUserRole: async (id: string, role: AdminRole): Promise<AdminUser> => {
    const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/role`, { role });
    return response.data;
  },
};

export const paymentsApi = {
  processPayment: async (
    idempotencyKey: string,
    data: { orderId: string; method: 'E_WALLET' | 'BANK_CARD'; forceFail?: boolean },
  ) => {
    const response = await apiClient.post('/payments', data, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },
};
