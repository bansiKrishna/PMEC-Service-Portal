import { create } from 'zustand';
import type { AuthState, LoginResponse } from '../types/auth';
import type { Role } from '../types/user';

const TOKEN_KEY = 'pmec_auth_token';
const USER_KEY = 'pmec_auth_user';

const getInitialToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const getInitialUser = (): AuthState['user'] => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? (JSON.parse(data) as AuthState['user']) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),

  setAuth: (response: LoginResponse) => {
    const user = {
      userId: response.userId,
      name: response.name,
      email: response.email,
      role: response.role as Role,
    };
    try {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save auth state to localStorage', e);
    }
    set({ token: response.token, user, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to remove auth state from localStorage', e);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (data: Partial<LoginResponse>) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = {
        ...state.user,
        name: data.name ?? state.user.name,
        email: data.email ?? state.user.email,
        role: (data.role as Role) ?? state.user.role,
      };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Failed to update user in localStorage', e);
      }
      return { user: updatedUser };
    });
  },
}));
