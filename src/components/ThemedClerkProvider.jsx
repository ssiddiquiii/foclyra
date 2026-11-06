import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useTheme } from '../hooks/useTheme';

/**
 * ThemedClerkProvider wraps ClerkProvider and synchronizes Clerk's UI appearance
 * (Sign In modal, User Profile, etc.) with Foclyra's obsidian dark and editorial light studio aesthetics.
 */
export default function ThemedClerkProvider({ children, publishableKey }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
              borderRadius: '1rem',
              fontFamily: 'var(--font-sans)',
            }
          : {
              colorPrimary: '#111111',
              colorBackground: '#ffffff',
              colorInputBackground: '#f4f4f4',
              colorInputText: '#111111',
              colorText: '#111111',
              colorTextSecondary: '#666666',
              borderRadius: '1rem',
              fontFamily: 'var(--font-sans)',
            },
        elements: {
          card: isDark
            ? 'border border-white/10 shadow-2xl bg-[#121215]'
            : 'border border-zinc-200 shadow-xl bg-white',
          navbar: isDark ? 'border-r border-white/10' : 'border-r border-zinc-200',
          navbarButton: isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black',
          headerTitle: 'font-semibold tracking-tight',
          userButtonPopoverCard: isDark ? 'bg-[#121215] border border-white/10' : 'bg-white border border-zinc-200',
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}

