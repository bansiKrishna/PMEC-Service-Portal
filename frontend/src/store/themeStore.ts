import { create } from 'zustand';
import type { Theme } from '../types/common';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'pmec_portal_theme';

const getInitialTheme = (): Theme => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
  } catch {
    // fallback
  }
  return 'dark'; // Black theme default as requested
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme setting', e);
    }
    applyTheme(theme);
    set({ theme });
  },
}));

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

// Immediately apply initial theme to avoid flash
applyTheme(getInitialTheme());
