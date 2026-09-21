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
