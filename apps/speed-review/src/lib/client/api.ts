import axios from 'axios';
import { configure } from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const { auth } = useAuthStore.getState();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

configure({ axios: axiosInstance });

export const authFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const { auth } = useAuthStore.getState();
  const headers = new Headers(init?.headers);
  if (auth?.token) {
    headers.set('Authorization', `Bearer ${auth.token}`);
  }

  return fetch(input, { ...init, headers });
};
