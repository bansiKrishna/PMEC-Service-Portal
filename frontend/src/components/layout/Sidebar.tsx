import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  FileCode,
  FilePlus2,
  FileText,
  Award,
  User,
  BookOpen,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getNavGroups = (): NavGroup[] => {
    if (!user) return [];

    switch (user.role) {
      case 'ADMIN':
        return [
          {
            items: [
              { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            ],
          },
          {
            label: 'Management',
            items: [
              { label: 'Staff Management', path: '/admin/staff', icon: <Users className="w-3.5 h-3.5" /> },
              { label: 'Certificate Templates', path: '/admin/certificate-templates', icon: <FileCode className="w-3.5 h-3.5" /> },
              { label: 'System Settings', path: '/admin/settings', icon: <Settings className="w-3.5 h-3.5" /> },
            ],
          },
        ];

      case 'STUDENT':
        return [
          {
            items: [
              { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            ],
          },
          {
            label: 'Services',
            items: [
              { label: 'Apply Bonafide', path: '/student/bonafide', icon: <FilePlus2 className="w-3.5 h-3.5" /> },
              { label: 'My Applications', path: '/student/applications', icon: <FileText className="w-3.5 h-3.5" /> },
              { label: 'My Certificates', path: '/student/certificates', icon: <Award className="w-3.5 h-3.5" /> },
            ],
          },
          {
            label: 'Account',
            items: [
              { label: 'My Profile', path: '/student/profile', icon: <User className="w-3.5 h-3.5" /> },
            ],
          },
        ];

      case 'DSW':
        return [
          {
            items: [
              { label: 'Dashboard', path: '/dsw/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
              { label: 'Bonafide Reviews', path: '/dsw/applications', icon: <FileText className="w-3.5 h-3.5" /> },
            ],
          },
        ];

      case 'PRINCIPAL':
        return [
          {
            items: [
              { label: 'Dashboard', path: '/principal/dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
              { label: 'Bonafide Approvals', path: '/principal/applications', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            ],
          },
        ];

      case 'LIBRARIAN':
        return [
          {
            items: [
              { label: 'Library Dashboard', path: '/librarian/dashboard', icon: <BookOpen className="w-3.5 h-3.5" /> },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out', { description: 'You have been successfully signed out.' });
    navigate('/login');
  };

  const navGroups = getNavGroups();

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-200 ease-in-out ${
        collapsed ? 'w-14' : 'w-56'
      } ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-[48px] items-center px-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-sidebar-foreground tracking-tight leading-none">PMEC</div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate">Service Portal</div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </div>

      {/* Role Tag */}
      {!collapsed && user && (
        <div className="px-3 pt-2.5 pb-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {user.role}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {!collapsed && group.label && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 mb-1">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onMobileClose && onMobileClose()}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        {!collapsed && user && (
          <div className="px-2 py-1.5 mb-1">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={`sidebar-nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
