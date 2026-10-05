import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, Users } from 'lucide-react';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-slate-950">
      {/* Left Branding Panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-800 p-10 relative overflow-hidden shrink-0">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-1/2 translate-y-1/3" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white leading-none">PMEC</div>
              <div className="text-xs text-blue-200 leading-tight">College Service Portal</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold text-white leading-snug mb-4">
            Parala Maharaja<br />Engineering College
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
            The official student services portal. Submit applications, track approvals, and download
            official certificates — all in one place.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {[
              { icon: BookOpen, label: 'Bonafide Certificate Applications' },
              { icon: Users, label: 'Multi-level Approval Workflow' },
              { icon: Award, label: 'Instant PDF Certificate Download' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-blue-100">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} PMEC, Berhampur, Odisha
          </p>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">PMEC Portal</span>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        {/* Auth Form Area */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-[400px]">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <div className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
          © {new Date().getFullYear()} Parala Maharaja Engineering College. All rights reserved.
        </div>
      </div>
    </div>
  );
};
