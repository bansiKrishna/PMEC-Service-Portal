import { useAuthStore } from '../store/authStore';
import type { Role } from '../types/user';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout, updateUser } = useAuthStore();

  const hasRole = (role: Role | Role[]): boolean => {
    if (!user || !user.role) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const getDefaultRedirectPath = (): string => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DSW':
        return '/dsw/dashboard';
      case 'PRINCIPAL':
        return '/principal/dashboard';
      case 'LIBRARIAN':
        return '/librarian/dashboard';
      case 'STUDENT':
      default:
        return '/student/dashboard';
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    role: user?.role,
    hasRole,
    getDefaultRedirectPath,
    setAuth,
    logout,
    updateUser,
  };
}
