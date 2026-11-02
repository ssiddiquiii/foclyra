export const COMPLETION_THRESHOLD = 0.9;
export const PROGRESS_SAVE_INTERVAL_MS = 10000;

export function clampPlaybackTime(seconds, duration) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return Number.isFinite(duration) && duration > 0
    ? Math.min(safeSeconds, duration)
    : safeSeconds;
}

export function getBoundedResumeSeconds(progress, duration, startTimestamp = 0) {
  if (progress?.completed === true) return clampPlaybackTime(startTimestamp, duration);
  const watchedSeconds = progress?.watchTime ?? progress?.currentTime ?? 0;
  const resumeSeconds = watchedSeconds > 0 ? Math.max(0, watchedSeconds - 2) : startTimestamp;
  return clampPlaybackTime(resumeSeconds, duration);
}

export function createPlaybackPersistenceSession({ courseId, lessonId, writeProgress }) {
  let writeQueue = Promise.resolve();
  let lastRequested = null;

  function persist({ seconds, duration, completed = false, ended = false }) {
    const boundedSeconds = ended ? Math.max(0, duration || seconds || 0) : clampPlaybackTime(seconds, duration);
    const roundedSeconds = Math.max(0, Math.round(boundedSeconds));
    // Udemy-style: automatic completion upon video end or reaching 90%+ duration
    const stickyCompletionSignal = completed || ended ||
      (Number.isFinite(duration) && duration > 0 && boundedSeconds / duration >= COMPLETION_THRESHOLD);
    const signature = `${roundedSeconds}:${stickyCompletionSignal}`;
    if (signature === lastRequested) return writeQueue;
    lastRequested = signature;

    writeQueue = writeQueue
      .catch(() => {})
      .then(() => writeProgress(courseId, lessonId, roundedSeconds, stickyCompletionSignal));
    return writeQueue;
  }

  function persistPlayer(player, options = {}) {
    if (!player || typeof player.getCurrentTime !== 'function') return writeQueue;
    try {
      return persist({
        seconds: player.getCurrentTime(),
        duration: typeof player.getDuration === 'function' ? player.getDuration() : 0,
        ...options
      });
    } catch {
      return writeQueue;
    }
  }

  return { persist, persistPlayer, flush: () => writeQueue };
}
