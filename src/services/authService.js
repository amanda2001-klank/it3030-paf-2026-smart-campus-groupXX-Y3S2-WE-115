import axios from 'axios';
import { API_BASE_URL } from './apiClient';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const registerUser = (payload) => authClient.post('/api/auth/register', payload);

export const loginUser = (payload) => authClient.post('/api/auth/login', payload);

export const loginWithGoogle = (idToken) =>
  authClient.post('/api/auth/google', {
    idToken,
  });
