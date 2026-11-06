import React, { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { getInitialTheme } from '../hooks/useTheme';

/**
 * ThemedClerkProvider wraps ClerkProvider and synchronizes Clerk's UI appearance
 * with Foclyra's dark and light themes without internal corner seams or gaps.
 */
export default function ThemedClerkProvider({ children, publishableKey }) {
  const [isDark, setIsDark] = useState(() => getInitialTheme() === 'dark');

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains('dark'));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: isDark
          ? {
              colorPrimary: '#ffffff',
              colorBackground: '#121215',
              colorInputBackground: '#18181c',
              colorInputText: '#ffffff',
              colorText: '#f5f5f7',
              colorTextSecondary: '#a1a1aa',
              borderRadius: '0.75rem',
              fontFamily: 'var(--font-sans)',
            }
          : {
              colorPrimary: '#111111',
              colorBackground: '#ffffff',
              colorInputBackground: '#f4f4f4',
              colorInputText: '#111111',
              colorText: '#111111',
              colorTextSecondary: '#666666',
              borderRadius: '0.75rem',
              fontFamily: 'var(--font-sans)',
            },
        elements: {
          cardBox: isDark
            ? '!rounded-[20px] !overflow-hidden border border-white/10 !shadow-2xl !bg-[#121215]'
            : '!rounded-[20px] !overflow-hidden border border-zinc-200/90 !shadow-2xl !bg-white',
          card: '!rounded-none !shadow-none !border-0 !m-0 !bg-transparent',
          scrollBox: isDark
            ? '!rounded-none !shadow-none !border-0 !m-0 !bg-[#121215]'
            : '!rounded-none !shadow-none !border-0 !m-0 !bg-white',
          pageScrollBox: '!rounded-none !shadow-none !border-0',
          navbar: isDark
            ? '!rounded-none !m-0 !bg-[#16161a] border-r border-white/10'
            : '!rounded-none !m-0 !bg-zinc-50/90 border-r border-zinc-200/80',
          navbarButton: isDark
            ? 'text-zinc-300 hover:text-white !rounded-lg'
            : 'text-zinc-700 hover:text-black !rounded-lg',
          footer: isDark
            ? '!rounded-none !mt-0 !bg-[#16161a] border-t border-white/10'
            : '!rounded-none !mt-0 !bg-zinc-50 border-t border-zinc-200/80',
          headerTitle: 'font-semibold tracking-tight',
          userButtonPopoverCard: isDark
            ? '!rounded-[16px] !overflow-hidden bg-[#121215] border border-white/10'
            : '!rounded-[16px] !overflow-hidden bg-white border border-zinc-200',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
