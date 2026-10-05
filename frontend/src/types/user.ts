export type Role = 'STUDENT' | 'DSW' | 'PRINCIPAL' | 'LIBRARIAN' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  rollNumber?: string;
  department?: string;
  semester?: number;
  enabled?: boolean;
  emailVerified?: boolean;
}
