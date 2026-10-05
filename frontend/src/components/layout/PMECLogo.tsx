import React from 'react';
import { GraduationCap } from 'lucide-react';

interface PMECLogoProps {
  collapsed?: boolean;
  className?: string;
}

export const PMECLogo: React.FC<PMECLogoProps> = ({ collapsed = false, className = '' }) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20">
        <GraduationCap className="h-6 w-6" />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-lg leading-none">
            PMEC
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-tight">
            College Service Portal
          </span>
        </div>
      )}
    </div>
  );
};
