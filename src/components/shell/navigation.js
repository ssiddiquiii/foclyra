import { BookOpen, Settings, Sparkles } from 'lucide-react';

export const navigationItems = [
  { name: 'Dashboard', path: '/studio', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Showcase', path: '/', icon: Sparkles }
];

export function isNavigationActive(pathname, path) {
  if (path === '/studio') {
    return pathname === '/studio' || pathname.startsWith('/courses/');
  }
  if (path === '/') {
    return pathname === '/' || pathname === '/landing' || pathname === '/welcome';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
