import { create } from 'zustand';
import { User } from '../types';
import { storage } from '../services/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => User | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storage.getCurrentUser(),
  isAuthenticated: !!storage.getCurrentUser(),
  loading: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const users = storage.getUsers();
      const user = users.find(u => u.username === username);
      
      if (user && password === '123456') {
        storage.setCurrentUser(user);
        set({ user, isAuthenticated: true, loading: false });
        return true;
      }
      set({ loading: false });
      return false;
    } catch (error) {
      set({ loading: false });
      return false;
    }
  },

  logout: () => {
    storage.setCurrentUser(null);
    set({ user: null, isAuthenticated: false });
  },

  getCurrentUser: () => {
    return storage.getCurrentUser();
  },
}));
