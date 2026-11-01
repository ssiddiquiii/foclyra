import { BookOpen, Settings, Sparkles } from 'lucide-react';

export const navigationItems = [
  { name: 'Dashboard', path: '/', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Showcase', path: '/landing', icon: Sparkles }
];

export function isNavigationActive(pathname, path) {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
}
