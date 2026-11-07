import { BookOpen, Settings, Sparkles, Key } from 'lucide-react';
import { ENABLE_AI_FEATURES } from '../../config/features';

export const navigationItems = [
  { name: 'Dashboard', path: '/studio', icon: BookOpen },
  ...(ENABLE_AI_FEATURES ? [{ name: 'API Keys', path: '/api-keys', icon: Key }] : []),
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Showcase', path: '/', icon: Sparkles }
];

/**
 * Returns navigation items filtered by authentication status.
 * Registered logged-in users NEVER see the landing page ('/') showcase icon.
 */
export function getNavigationItems(user) {
  if (user) {
    return navigationItems.filter(item => item.path !== '/');
  }
  return navigationItems;
}

export function isNavigationActive(pathname, path) {
  if (path === '/studio') {
    return pathname === '/studio' || pathname.startsWith('/courses/');
  }
  if (path === '/') {
    return pathname === '/' || pathname === '/landing' || pathname === '/welcome';
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}
