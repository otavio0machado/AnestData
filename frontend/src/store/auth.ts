import { create } from 'zustand';
import { User } from '../types';
import api from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, senha) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));
