import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Library } from 'lucide-react';
import { librarianApi } from '../../api/librarianApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { EmptyState } from '../../components/common/EmptyState';

export const LibrarianDashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalBooks: number; activeLoans: number; overdueLoans: number; message: string } | null>(null);

  useEffect(() => {
    librarianApi.getLibraryStats().then(setStats);
  }, []);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Management</h1>
          <p className="page-description">PMEC Central Library workspace and loan record management.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Catalogue Books</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Library className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">{stats?.totalBooks || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Catalogued volumes</p>
          </div>
        </div>

        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Loans</span>
            <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground font-mono">{stats?.activeLoans || 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Currently issued</p>
          </div>
        </div>

        <div className="stat-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Clearance Authority</span>
            <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">ROLE_LIBRARIAN Active</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Library clearance verification</p>
          </div>
        </div>
      </div>

      {/* Module Card */}
      <Card>
        <CardHeader>
          <CardTitle>Library Management Integration</CardTitle>
          <CardDescription>
            This module architecture is isolated and scalable so additional library APIs can be linked directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Library className="w-5 h-5 text-emerald-500" />}
            title="Library Desk Configured"
            description="The Librarian navigation shell and authorization guards are fully configured and ready."
          />
        </CardContent>
      </Card>
    </div>
  );
};
