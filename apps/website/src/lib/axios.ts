import axios from 'axios';
import { configure } from 'axios-hooks';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8000'),
});

// Configure axios-hooks to use our configured instance
configure({ axios: axiosInstance });

export default axiosInstance;
