import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const { user, getDefaultRedirectPath } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full text-center glass-panel p-8 rounded-2xl border-rose-500/30 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">403 - Access Denied</h1>
          <p className="text-sm text-slate-400">
            You do not have administrative privileges to access this requested route.
          </p>
          {user && (
            <div className="mt-2 text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              Current Logged Role: <span className="font-bold text-blue-400">{user.role}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
          <Button onClick={() => navigate(getDefaultRedirectPath())} className="gap-2">
            <Home className="w-4 h-4" /> Return to My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
