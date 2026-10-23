
import React from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";

interface HeaderProps {
  collapsed: boolean;
  onMobileMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, { title: string }> = {
  "/admin/dashboard": { title: "Dashboard" },
  "/admin/staff": { title: "Staff Management" },
  "/admin/certificate-templates": { title: "Certificate Templates" },
  "/admin/settings": { title: "System Settings" },
  "/admin/email-settings": { title: "Email Service Settings" },

  "/student/dashboard": { title: "Dashboard" },
  "/student/bonafide": { title: "Apply for Bonafide" },
  "/student/applications": { title: "My Applications" },
  "/student/certificates": { title: "My Certificates" },
  "/student/profile": { title: "My Profile" },
  "/student/semester-registration": { title: "Semester Registration" },

  "/dsw/dashboard": { title: "Dashboard" },
  "/dsw/applications": { title: "Bonafide Reviews" },
  "/dsw/registrations": { title: "Semester Registration" },
  "/dsw/notifications": { title: "Notifications" },
  "/dsw/reports": { title: "Reports & Analytics" },
  "/dsw/activity-log": { title: "Activity Log" },
  "/dsw/scholarships": { title: "Scholarship Verification" },
  "/dsw/student-assistance": { title: "Student Assistance" },
  "/dsw/hostel": { title: "Hostel Management" },
  "/dsw/grievances": { title: "Grievance Management" },
  "/dsw/anti-ragging": { title: "Anti-Ragging Cases" },
  "/dsw/profile": { title: "My Profile" },
  "/dsw/settings": { title: "Settings" },

  "/principal/dashboard": { title: "Dashboard" },
  "/principal/applications": { title: "Bonafide Approvals" },

  "/librarian/dashboard": { title: "Library Dashboard" },
};

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
}) => {
  const location = useLocation();

  const getPageTitle = (): string => {
    const pathname = location.pathname;

    // Exact route match
    const exact = PAGE_TITLES[pathname];
    if (exact) return exact.title;

    // Match nested routes, such as /student/applications/5
    const matchingRoute = Object.keys(PAGE_TITLES)
      .filter((path) => pathname.startsWith(`${path}/`))
      .sort((a, b) => b.length - a.length)[0];

    if (matchingRoute) {
      return `${PAGE_TITLES[matchingRoute].title} Details`;
    }

    // Fallback for routes not listed above
    const segments = pathname.split("/").filter(Boolean);
    const page = segments[segments.length - 1];

    return page
      ? page
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : "Dashboard";
  };

  const pageTitle = getPageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center border-b border-border bg-card/95 px-3 backdrop-blur-md sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Mobile menu */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
          className="size-7 shrink-0 md:hidden"
        >
          <Menu className="size-4" />
        </Button>

        {/* Page title only */}
        <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
          {pageTitle}
        </h1>
      </div>

      {/* Right actions */}
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
};
