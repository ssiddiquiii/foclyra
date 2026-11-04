/**
 * Foclyra AI Tutor Quota Management Service
 * Enforces a daily 30-question limit that resets every night at midnight (00:00 local time).
 * Users with personal Gemini API keys bypass the limit completely.
 */

const AI_QUOTA_STORAGE_KEY = 'foclyra_ai_tutor_daily_quota';
export const DAILY_AI_QUESTION_LIMIT = 30;

/**
 * Calculates the Unix timestamp (ms) for the upcoming midnight (00:00:00) in the user's local timezone.
 */
export function getNextMidnightTimestamp() {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * Checks whether user has configured a custom Gemini API key.
 */
export function hasCustomApiKey() {
  try {
    const key = localStorage.getItem('foclyra_custom_gemini_api_key') || '';
    return key.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Loads or initializes the current quota tracking state.
 */
function getStoredQuotaData() {
  const now = Date.now();
  let data = null;

  try {
    const raw = localStorage.getItem(AI_QUOTA_STORAGE_KEY);
    if (raw) {
      data = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse AI quota storage:', e);
  }

  // If uninitialized or if past reset timestamp, reset to clean slate
  if (!data || !data.resetAt || now >= data.resetAt) {
    data = {
      used: 0,
      resetAt: getNextMidnightTimestamp()
    };
    saveStoredQuotaData(data);
  }

  return data;
}

function saveStoredQuotaData(data) {
  try {
    localStorage.setItem(AI_QUOTA_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist AI quota storage:', e);
  }
}

/**
 * Returns formatted countdown until reset (e.g., "5h 20m" or "45m").
 */
export function getTimeUntilReset(resetAt) {
  const diffMs = Math.max(0, resetAt - Date.now());
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Retrieves the live AI Tutor quota status.
 */
export function getAiQuotaStatus() {
  const isUnlimited = hasCustomApiKey();
  const data = getStoredQuotaData();
  const used = Math.min(DAILY_AI_QUESTION_LIMIT, Math.max(0, data.used || 0));
  const remaining = Math.max(0, DAILY_AI_QUESTION_LIMIT - used);
  const resetCountdown = getTimeUntilReset(data.resetAt);

  return {
    used,
    remaining: isUnlimited ? Infinity : remaining,
    max: DAILY_AI_QUESTION_LIMIT,
    isUnlimited,
    canAsk: isUnlimited || remaining > 0,
    resetAt: data.resetAt,
    resetCountdown
  };
}

/**
 * Consumes 1 question from the quota.
 * Returns true if allowed, false if quota was exhausted.
 */
export function consumeAiQuota() {
  if (hasCustomApiKey()) {
    return true; // Bypass quota for custom key owners
  }

  const data = getStoredQuotaData();
  if (data.used >= DAILY_AI_QUESTION_LIMIT) {
    return false; // Quota exhausted
  }

  data.used += 1;
  saveStoredQuotaData(data);
  return true;
}
