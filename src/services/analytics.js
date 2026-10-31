import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env?.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env?.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let isInitialized = false;

/**
 * Initializes PostHog Web Analytics in privacy-friendly mode.
 * If VITE_POSTHOG_KEY is not set (e.g. in development or testing), it degrades gracefully.
 */
export function initAnalytics() {
  if (isInitialized || !POSTHOG_KEY || typeof window === 'undefined') return;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      autocapture: false, // Privacy protection: Do not blindly capture user keystrokes/notes
      capture_pageview: false, // Manually captured via React Router for SPA accuracy
      capture_pageleave: true,
      persistence: 'localStorage',
      disable_session_recording: false,
      loaded: () => {
        isInitialized = true;
      }
    });
    isInitialized = true;
  } catch (err) {
    console.warn('[Analytics] Failed to initialize PostHog:', err);
  }
}

/**
 * Capture custom product metrics.
 */
export function trackEvent(eventName, properties = {}) {
  if (!isInitialized) return;
  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('[Analytics] Track event error:', err);
  }
}

/**
 * Identify signed in user.
 */
export function identifyUser(userId, userProperties = {}) {
  if (!isInitialized || !userId) return;
  try {
    posthog.identify(userId, userProperties);
  } catch (err) {
    console.warn('[Analytics] Identify error:', err);
  }
}

/**
 * Reset identity on logout or account deletion.
 */
export function resetUser() {
  if (!isInitialized) return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn('[Analytics] Reset error:', err);
  }
}

/**
 * Track SPA route transitions.
 */
export function trackPageView(path, properties = {}) {
  if (!isInitialized) return;
  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path,
      ...properties,
    });
  } catch (err) {
    console.warn('[Analytics] Pageview error:', err);
  }
}

export { posthog };

