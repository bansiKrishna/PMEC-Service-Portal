import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { User, Mail, Shield } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Student Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Official student account details registered in the PMEC database.
        </p>
      </div>

      <Card className="glass-panel">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user?.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">{user?.email}</CardDescription>
          </div>
          <Badge variant="default" className="text-xs px-3 py-1">
            ROLE: {user?.role}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Full Name
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" /> College Email
              </span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> User ID
              </span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">#{user?.userId}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
