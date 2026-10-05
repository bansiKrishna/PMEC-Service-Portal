import type { Role } from './user';

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  role: Role;
  password: string;
}

export interface StaffResponse {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
}

export interface SetStaffPasswordRequest {
  password: string;
}

export interface SetStaffRoleRequest {
  role: Role;
}
