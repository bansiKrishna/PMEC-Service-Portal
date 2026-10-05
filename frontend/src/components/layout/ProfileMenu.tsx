import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const avatarBg = (() => {
    switch (user.role) {
      case 'ADMIN': return 'bg-blue-600';
      case 'DSW': return 'bg-amber-500';
      case 'PRINCIPAL': return 'bg-emerald-600';
      case 'LIBRARIAN': return 'bg-purple-600';
      case 'STUDENT': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          aria-label="User menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className={`${avatarBg} text-white text-xs font-bold`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px] leading-none">
              {user.name}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">{user.role}</span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal py-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">{user.role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'STUDENT' && (
          <DropdownMenuItem onClick={() => navigate('/student/profile')} className="gap-2 text-sm">
            <User className="h-3.5 w-3.5" /> My Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 text-sm text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
