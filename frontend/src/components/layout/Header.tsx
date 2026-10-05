import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';

interface HeaderProps {
  collapsed: boolean;
  onMobileMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, { title: string; breadcrumb?: string }> = {
  '/admin/dashboard': { title: 'Dashboard', breadcrumb: 'Admin' },
  '/admin/staff': { title: 'Staff Management', breadcrumb: 'Admin' },
  '/admin/certificate-templates': { title: 'Certificate Templates', breadcrumb: 'Admin' },
  '/admin/settings': { title: 'System Settings', breadcrumb: 'Admin' },
  '/student/dashboard': { title: 'Dashboard', breadcrumb: 'Student' },
  '/student/bonafide': { title: 'Apply for Bonafide', breadcrumb: 'Student' },
  '/student/applications': { title: 'My Applications', breadcrumb: 'Student' },
  '/student/certificates': { title: 'My Certificates', breadcrumb: 'Student' },
  '/student/profile': { title: 'My Profile', breadcrumb: 'Student' },
  '/dsw/dashboard': { title: 'Dashboard', breadcrumb: 'DSW' },
  '/dsw/applications': { title: 'Bonafide Reviews', breadcrumb: 'DSW' },
  '/principal/dashboard': { title: 'Dashboard', breadcrumb: 'Principal' },
  '/principal/applications': { title: 'Bonafide Approvals', breadcrumb: 'Principal' },
  '/librarian/dashboard': { title: 'Dashboard', breadcrumb: 'Librarian' },
};

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const location = useLocation();

  const getPageInfo = () => {
    // Try exact match first
    const exact = PAGE_TITLES[location.pathname];
    if (exact) return exact;

    // Try prefix match for dynamic routes (e.g. /student/applications/5)
    for (const key of Object.keys(PAGE_TITLES)) {
      if (location.pathname.startsWith(key + '/')) {
        return { ...PAGE_TITLES[key], title: PAGE_TITLES[key].title + ' Details' };
      }
    }

    // Fallback: parse from URL
    const segments = location.pathname.split('/').filter(Boolean);
    const section = segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : '';
    const page = segments[1]
      ? segments[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Dashboard';
    return { title: page, breadcrumb: section };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-20 h-[48px] flex items-center px-3 md:px-5 bg-card/95 backdrop-blur border-b border-border shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden h-7 w-7 text-muted-foreground"
        >
          <Menu className="h-3.5 w-3.5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Breadcrumb + Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          {pageInfo.breadcrumb && (
            <>
              <span className="hidden sm:inline text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {pageInfo.breadcrumb}
              </span>
              <span className="hidden sm:inline text-muted-foreground/40 text-xs">/</span>
            </>
          )}
          <h1 className="text-xs font-semibold text-foreground truncate tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
};
