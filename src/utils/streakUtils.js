/**
 * Formats a Date object or timestamp into ISO local date string YYYY-MM-DD.
 * Returns null if timestamp is missing or invalid.
 * @param {Date | number | string} dateInput
 * @returns {string | null}
 */
export function toLocalDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Derives the Set of unique YYYY-MM-DD local dates on which the user completed active study.
 * Video activity rule: watchTime || currentTime >= 600s OR completed === true.
 * Timestamps used for video: lastWatched || updatedAt.
 * Practice activity rule: completed === true.
 * Timestamps used for practice: completedAt || updatedAt.
 * @param {Array<object>} progressList
 * @param {Array<object>} practiceProgressList
 * @returns {Set<string>}
 */
export function getActiveDateSet(progressList = [], practiceProgressList = []) {
  const activeDateSet = new Set();

  // Rule 1: Video watched >= 10 mins (600s) or completed
  progressList.forEach(p => {
    const watchedSeconds = p.watchTime ?? p.currentTime ?? 0;
    const isActive = watchedSeconds >= 600 || p.completed === true;
    if (isActive) {
      const timestamp = p.lastWatched || p.updatedAt;
      const dateStr = toLocalDateString(timestamp);
      if (dateStr) {
        activeDateSet.add(dateStr);
      }
    }
  });

  // Rule 2: Practice question marked completed
  practiceProgressList.forEach(p => {
    if (p.completed === true) {
      const timestamp = p.completedAt || p.updatedAt;
      const dateStr = toLocalDateString(timestamp);
      if (dateStr) {
        activeDateSet.add(dateStr);
      }
    }
  });

  return activeDateSet;
}

/**
 * Foclyra Real-Time Dynamic Streak Calculator
 * Calculates active consecutive daily streak ending today or yesterday.
 * @param {Array<object>} progressList
 * @param {Array<object>} practiceProgressList
 * @returns {number}
 */
export function calculateStreak(progressList = [], practiceProgressList = []) {
  const activeDateSet = getActiveDateSet(progressList, practiceProgressList);

  let streakCount = 0;
  let checkDate = new Date();
  
  while (true) {
    const dateStr = toLocalDateString(checkDate);
    if (activeDateSet.has(dateStr)) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (streakCount === 0) {
      // Check if yesterday was active
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = toLocalDateString(checkDate);
      if (activeDateSet.has(yesterdayStr)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streakCount;
}

export function buildMonthlyActivityCalendar(activeDateSet, viewDate, today = new Date()) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const todayString = toLocalDateString(today);

  return {
    label: viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    days: Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return {
        day,
        date,
        isActive: activeDateSet.has(date),
        isToday: date === todayString
      };
    }),
    leadingEmptyDays: firstDayOfWeek
  };
}
