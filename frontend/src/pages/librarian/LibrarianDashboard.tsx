import React, { useEffect, useState } from "react";
import { BookOpen, ShieldCheck, Library, AlertTriangle } from "lucide-react";

import { librarianApi } from "../../api/librarianApi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { EmptyState } from "../../components/common/EmptyState";

interface LibraryStats {
  totalBooks: number;
  activeLoans: number;
  overdueLoans: number;
  message: string;
}

export const LibrarianDashboard: React.FC = () => {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    librarianApi
      .getLibraryStats()
      .then((data) => {
        if (mounted) {
          setStats(data);
          setError(false);
        }
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const statItems = [
    {
      label: "Catalogue Books",
      value: stats?.totalBooks,
      description: "Catalogued volumes",
      footer: "Total library collection",
      icon: Library,
    },
    {
      label: "Active Loans",
      value: stats?.activeLoans,
      description: "Currently issued",
      footer: "Current circulation",
      icon: BookOpen,
    },
    {
      label: "Overdue Loans",
      value: stats?.overdueLoans,
      description: "Past their due date",
      footer: "Requires attention",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Compact page header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4 shrink-0 text-muted-foreground" />

            <h1 className=" font-semibold tracking-tight text-foreground">
              Library Management
            </h1>
          </div>

          <p className="mt-1 text-xs page-description text-muted-foreground">
            PMEC Central Library · Administrative workspace
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 border border-border px-2.5 py-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />

          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-foreground">
              Librarian Access
            </p>
            <p className="text-[9px] text-muted-foreground">ROLE_LIBRARIAN</p>
          </div>
        </div>
      </header>

      {/* Full-width responsive dashboard */}
      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_235px]">
        {/* Main content */}
        <main className="min-w-0 space-y-3">
          <Card className="min-w-0 rounded-none border-border shadow-none">
            <CardHeader className="space-y-1 border-b border-border px-3 py-3 sm:px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-sm font-semibold">
                    Library Workspace
                  </CardTitle>

                  <CardDescription className="max-w-2xl text-[11px] leading-relaxed">
                    Access library services and manage circulation records
                    through the existing library system.
                  </CardDescription>
                </div>

                <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted/30">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4">
              <EmptyState
                icon={<Library className="h-4 w-4 text-muted-foreground" />}
                title="Library Desk Configured"
                description="The library workspace and role-based access are configured. Additional library services can be connected here."
              />
            </CardContent>
          </Card>

          {/* Clearance information */}
          <div className="flex items-start gap-2.5 border border-border bg-muted/20 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Library Clearance Authority
              </p>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                The librarian account is designated for library-related
                verification and clearance activities.
              </p>
            </div>
          </div>
        </main>

        {/* Right-side square statistics cards */}
        <aside className="flex min-w-0 flex-col gap-2">
          <div className="border border-border bg-card px-3 py-2.5">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
              Library Overview
            </h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Current statistics
            </p>
          </div>

          {statItems.map((item) => {
            const Icon = item.icon;

            return (
              <section
                key={item.label}
                className="min-w-0 border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>

                    <p className="mt-2 text-xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
                      {loading ? (
                        <span className="inline-block h-5 w-10 animate-pulse bg-muted" />
                      ) : error ? (
                        "—"
                      ) : (
                        (item.value ?? 0).toLocaleString("en-IN")
                      )}
                    </p>

                    <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted/30">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-3 border-t border-border pt-2">
                  <p className="text-[9px] text-muted-foreground">
                    {item.footer}
                  </p>
                </div>
              </section>
            );
          })}

          {/* API status */}
          <div className="border border-border bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  loading
                    ? "bg-muted-foreground"
                    : error
                      ? "bg-destructive"
                      : "bg-emerald-600"
                }`}
              />

              <p className="text-[10px] text-muted-foreground">
                {loading
                  ? "Loading statistics..."
                  : error
                    ? "Statistics unavailable"
                    : "Statistics loaded"}
              </p>
            </div>

            {error && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-1.5 text-[10px] font-medium text-foreground underline underline-offset-2"
              >
                Reload dashboard
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
