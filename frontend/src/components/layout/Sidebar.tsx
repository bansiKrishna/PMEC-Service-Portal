import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Bell,
  ClipboardList,
  BookOpen,
  CalendarDays,
  GraduationCap,
  ChartNoAxesColumn,
  FileBadge,
  FileCheck,
  IdCard,
  ClipboardCheck,
  CreditCard,
  Award,
  House,
  // Library,
  // BriefcaseBusiness,
  // MessageSquareWarning,
  FileClock,
  Clock3,
  Download,
  UserRound,
  Settings,
  Users,
  FileCode,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookMarked,
  CalendarCheck,
  Wallet,
  Settings2,
  Mail,
  ChartNoAxesCombined,
  // Building2,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const studentNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/student/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Notifications",
        path: "/student/notifications",
        icon: Bell,
      },
    ],
  },
  {
    label: "Academic Services",
    items: [
      {
        label: "Semester Registration",
        path: "/student/semester-registration",
        icon: ClipboardList,
      },
      {
        label: "Subject Registration",
        path: "/student/subject-registration",
        icon: BookOpen,
      },
      {
        label: "Academic Calendar & Timetable",
        path: "/student/academic-calendar",
        icon: CalendarDays,
      },
      {
        label: "Examination Services",
        path: "/student/examinations",
        icon: GraduationCap,
      },
      {
        label: "Attendance & Internal Marks",
        path: "/student/attendance",
        icon: ChartNoAxesColumn,
      },
    ],
  },
  {
    label: "Certificates & Documents",
    items: [
      {
        label: "Issue Bonafide Certificate",
        path: "/student/bonafide",
        icon: FileBadge,
      },
      {
        label: "NOC & Permission Letters",
        path: "/student/noc-requests",
        icon: FileCheck,
      },
      {
        label: "Student ID Card",
        path: "/student/id-card",
        icon: IdCard,
      },
      {
        label: "No-Dues & Clearance",
        path: "/student/no-dues",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Financial & Welfare",
    items: [
      {
        label: "Fees & Receipts",
        path: "/student/fees",
        icon: CreditCard,
      },
      {
        label: "Scholarship & verification",
        path: "/student/scholarships",
        icon: Award,
      },
      {
        label: "Hostel & Mess",
        path: "/student/hostel",
        icon: House,
      },
    ],
  },

  {
    label: "My Activity",
    items: [
      {
        label: "My Applications",
        path: "/student/applications",
        icon: FileClock,
      },
      {
        label: "Application Tracking",
        path: "/student/application-tracking",
        icon: Clock3,
      },
      {
        label: "Issued Documents",
        path: "/student/certificates",
        icon: Download,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "My Profile",
        path: "/student/profile",
        icon: UserRound,
      },
      {
        label: "Settings & Security",
        path: "/student/settings",
        icon: Settings,
      },
    ],
  },
];

const roleNavGroups: Record<string, NavGroup[]> = {
  ADMIN: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          label: "Staff Management",
          path: "/admin/staff",
          icon: Users,
        },
        {
          label: "Certificate Templates",
          path: "/admin/certificate-templates",
          icon: FileCode,
        },
        {
          label: "System Settings",
          path: "/admin/settings",
          icon: Settings2,
        },
        {
          label: "Email Service Settings",
          path: "/admin/email-settings",
          icon: Mail,
        },
        {
          label: "Semester Registration",
          path: "/admin/semester-registration",
          icon: ClipboardList,
        },
      ],
    },
  ],

  DSW: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/dsw/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Notifications",
          path: "/dsw/notifications",
          icon: Bell,
        },
      ],
    },

    {
      label: "Service Management",
      items: [
        {
          label: "Pending Applications",
          path: "/dsw/applications",
          icon: ClipboardCheck,
        },
        {
          label: "Review History",
          path: "/dsw/review-history",
          icon: FileCheck,
        },
        {
          label: "Semester Registration",
          path: "/dsw/registrations",
          icon: CalendarCheck,
        },
      ],
    },

    {
      label: "Reports & Analytics",
      items: [
        {
          label: "Reports & Analytics",
          path: "/dsw/reports",
          icon: ChartNoAxesCombined,
        },
        {
          label: "Activity Log",
          path: "/dsw/activity-log",
          icon: History,
        },
      ],
    },

    {
      label: "Account",
      items: [
        {
          label: "My Profile",
          path: "/dsw/profile",
          icon: UserRound,
        },
        {
          label: "Settings",
          path: "/dsw/settings",
          icon: Settings,
        },
      ],
    },
  ],

  PRINCIPAL: [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/principal/dashboard",
          icon: LayoutDashboard,
        },
        {
          label: "Bonafide Approvals",
          path: "/principal/applications",
          icon: ShieldCheck,
        },
      ],
    },
  ],

  LIBRARIAN: [
  {
    label: "Library",
    items: [
      {
        label: "Library Dashboard",
        path: "/librarian/dashboard",
        icon: BookOpen,
      },
      {
        label: "Book Management",
        path: "/librarian/books",
        icon: BookMarked,
      },
      {
        label: "Issue & Return",
        path: "/librarian/circulation",
        icon: CalendarCheck,
      },
      {
        label: "Semester Due Verification",
        path: "/librarian/semester-due-verification",
        icon: ClipboardCheck,
      },
      {
        label: "No-Dues Requests",
        path: "/librarian/no-dues",
        icon: FileCheck,
      },
      {
        label: "Fine Records",
        path: "/librarian/fines",
        icon: Wallet,
      },
    ],
  },
],
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups =
    user?.role === "STUDENT"
      ? studentNavGroups
      : (roleNavGroups[user?.role ?? ""] ?? []);

  // Keep at most two navigation groups expanded at a time.
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    navGroups
      .map((group) => group.label)
      .filter((label) => label === "Overview" || label === "Academic Services")
      .slice(0, 2),
  );

  // Automatically expand the group containing the current route.
  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some(
        (item) =>
          location.pathname === item.path ||
          location.pathname.startsWith(`${item.path}/`),
      ),
    );

    if (activeGroup) {
      setOpenGroups((previous) => {
        if (previous.includes(activeGroup.label)) return previous;

        // Expand the active section and retain at most one other section.
        return [
          activeGroup.label,
          ...previous.filter((label) => label !== activeGroup.label),
        ].slice(0, 2);
      });
    }
  }, [location.pathname, user?.role]);

  const toggleGroup = (label: string) => {
    setOpenGroups((previous) => {
      if (previous.includes(label)) {
        return previous.filter((group) => group !== label);
      }

      // Opening a third section automatically collapses the oldest one.
      return [label, ...previous].slice(0, 2);
    });
  };

  const handleLogout = () => {
    logout();
    toast.success("Signed out", {
      description: "You have been successfully signed out.",
    });
    navigate("/login");
  };

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col",
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        "transition-[width,transform] duration-200 ease-in-out",
        collapsed ? "w-[68px]" : "w-[280px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      ].join(" ")}
    >
      {/* Brand */}
      <div
        className={[
          "flex h-[64px] shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        ].join(" ")}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-5" />
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight">PMEC</p>
            <p className="truncate text-xs text-muted-foreground">
              Digital Service Portal
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto hidden size-7 shrink-0 md:inline-flex"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Role indicator */}
      {!collapsed && user && (
        <div className="shrink-0 px-4 pb-2 pt-4">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1">
            <span className="size-2 shrink-0 rounded-full bg-primary" />
            <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-2 py-3"
      >
        {navGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);

          return (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-2 pb-1 pt-1 text-left"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
                    {group.label}
                  </span>

                  <ChevronDown
                    className={[
                      "size-3.5 text-muted-foreground transition-transform",
                      isOpen ? "" : "-rotate-90",
                    ].join(" ")}
                  />
                </button>
              )}

              {(collapsed || isOpen) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        title={collapsed ? item.label : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        onClick={() => onMobileClose?.()}
                        className={({ isActive }) =>
                          [
                            "group relative flex min-h-8 items-center gap-2.5",
                            "rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                            "transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            collapsed ? "justify-center px-0" : "",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-primary" />
                            )}

                            <Icon
                              className={[
                                "size-[15px] shrink-0",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                              ].join(" ")}
                            />

                            {!collapsed && (
                              <span className="min-w-0 flex-1 truncate">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Account footer */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        {!collapsed && user && (
          <button
            type="button"
            onClick={() =>
              navigate(
                user.role === "STUDENT" ? "/student/profile" : "/profile",
              )
            }
            className="mb-2 flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </p>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Sign Out" : undefined}
          className={[
            "flex min-h-8 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5",
            "text-[11px] font-medium text-destructive",
            "transition-colors hover:bg-destructive/10",
            collapsed ? "justify-center px-0" : "",
          ].join(" ")}
        >
          <LogOut className="size-[15px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
