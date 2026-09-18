import axios from 'axios';
import { configure } from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import { useNavigationState } from './navigation';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const { auth } = useAuthStore.getState();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) useAuthStore.getState().setAuth(null);
  return Promise.reject(error instanceof Error ? error : new Error(String(error)));
});

configure({ axios: axiosInstance });

export const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const { auth } = useAuthStore.getState();
  const headers = new Headers(init?.headers);
  if (auth?.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  const mutation = init?.method !== undefined && !['GET', 'HEAD'].includes(init.method.toUpperCase());
  if (mutation) useNavigationState.setState((state) => ({ pendingWrites: state.pendingWrites + 1 }));
  try {
    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) useAuthStore.getState().setAuth(null);
    return response;
  } finally {
    if (mutation) useNavigationState.setState((state) => ({ pendingWrites: state.pendingWrites - 1 }));
  }
};
