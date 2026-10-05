import type { Role } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  rollNumber: string;
  department?: string;
  semester?: number;
}

export interface RegisterResponse {
  id: number;
  fullName: string;
  email: string;
  rollNumber: string;
  role: Role;
  message?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AuthState {
  token: string | null;
  user: {
    userId: number;
    name: string;
    email: string;
    role: Role;
  } | null;
  isAuthenticated: boolean;
  setAuth: (response: LoginResponse) => void;
  logout: () => void;
  updateUser: (data: Partial<LoginResponse>) => void;
}
