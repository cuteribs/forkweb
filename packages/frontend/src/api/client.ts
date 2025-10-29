import axios from 'axios';
import type { ApiResponse } from '@forkweb/shared';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError = error.response?.data as ApiResponse;
    if (apiError?.error) {
      console.error('API Error:', apiError.error);
    }
    return Promise.reject(error);
  }
);

export default client;
