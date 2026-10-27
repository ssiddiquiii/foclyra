import { useCallback, useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../hooks/useUIStore';
import { saveProgress, updateLessonDuration } from '../../services/dataCommands';
import { QUALITY_OPTIONS, SPEED_OPTIONS } from './watchConstants';
import { createPlaybackPersistenceSession, getBoundedResumeSeconds, PROGRESS_SAVE_INTERVAL_MS } from './playbackPersistence';
import { createPlayerTimeStore } from './playerTimeStore';

const CAPTION_PREFERENCE_KEY = 'foclyra:watch:captions-enabled';

function readCaptionPreference() {
  try {
    return localStorage.getItem(CAPTION_PREFERENCE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyCaptionPreference(player, enabled) {
  if (!player) return;
  try {
    if (enabled) player.loadModule?.('captions');
    else {
      player.unloadModule?.('captions');
      player.unloadModule?.('cc');
    }
  } catch {}
}

export function useWatchPlayerController({ courseId, lessonId, lesson, progressList }) {
  const playerContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  const mouseTimerRef = useRef(null);
  const playerRef = useRef(null);
  const lessonRef = useRef(lesson);
  const progressListRef = useRef(progressList);
  const pendingSeekRef = useRef(null);
  const timeStoreRef = useRef(null);
  if (!timeStoreRef.current) timeStoreRef.current = createPlayerTimeStore();
  lessonRef.current = lesson;
  progressListRef.current = progressList;

  const {
    isPlaying,
    seekRequestTime,
    setActiveLessonId,
    setIsPlaying,
    triggerPlayerSeek,
    registerPlayerCommands,
    unregisterPlayerCommands
  } = useUIStore();
  const [ytPlayer, setYtPlayer] = useState(null);
  const [isPlayerTriggered, setIsPlayerTriggered] = useState(false);
  const [playerMuted, setPlayerMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [qualityLevel, setQualityLevel] = useState('auto');
  const [captionsEnabled, setCaptionsEnabled] = useState(readCaptionPreference);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const captionsEnabledRef = useRef(captionsEnabled);

  useEffect(() => {
    captionsEnabledRef.current = captionsEnabled;
    try {
      localStorage.setItem(CAPTION_PREFERENCE_KEY, String(captionsEnabled));
    } catch {}
  }, [captionsEnabled]);

  useEffect(() => {
    if (!lessonId) return;
    setActiveLessonId(lessonId);
    timeStoreRef.current.reset();
    setIsPlayerTriggered(false);
    setPlaybackSpeed(1);
  }, [lessonId, setActiveLessonId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || seekRequestTime === null) return;
    player.seekTo(seekRequestTime, true);
    player.playVideo();
    triggerPlayerSeek(null);
  }, [seekRequestTime, triggerPlayerSeek]);

  useEffect(() => {
    const activeLesson = lessonRef.current;
    if (!activeLesson || activeLesson.type !== 'youtube' || !isPlayerTriggered) return;

    let disposed = false;
    let playerInstance = null;
    let progressTimer = null;
    let uiSyncTimer = null;
    let initializeTimer = null;
    let playerCommands = null;
    const timeStore = timeStoreRef.current;
    const currentProgress = progressListRef.current.find(progress => progress.id === `${courseId}_${lessonId}`);
    const persistence = createPlaybackPersistenceSession({ courseId, lessonId, writeProgress: saveProgress });

    const persistPlayer = options => persistence.persistPlayer(playerRef.current || playerInstance, options);
    const stopTracking = () => {
      if (progressTimer) clearInterval(progressTimer);
      if (uiSyncTimer) clearInterval(uiSyncTimer);
      progressTimer = null;
      uiSyncTimer = null;
    };
    const startTracking = player => {
      stopTracking();
      progressTimer = setInterval(() => persistPlayer(), PROGRESS_SAVE_INTERVAL_MS);
      let lastStep = -1;
      uiSyncTimer = setInterval(() => {
        try {
          const time = player.getCurrentTime();
          const duration = player.getDuration();
          if (duration && duration > 0 && (!activeLesson.duration || activeLesson.duration === '0:00')) updateLessonDuration(lessonId, duration);
          const step = Math.floor(time * 4);
          if (step !== lastStep) {
            lastStep = step;
            timeStore.set(time, duration);
          }
        } catch {}
      }, 200);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistPlayer();
    };
    const handlePageHide = () => persistPlayer();

    const onPlayerStateChange = event => {
      if (disposed) return;
      const state = event.data;
      if (state === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        startTracking(event.target);
      } else {
        setIsPlaying(false);
        stopTracking();
        if (state === window.YT.PlayerState.PAUSED) persistPlayer();
        if (state === window.YT.PlayerState.ENDED) persistPlayer({ ended: true });
      }
    };

    const onPlayerReady = event => {
      if (disposed) return;
      const player = event.target;
      playerRef.current = player;
      setYtPlayer(player);
      playerCommands = {
        lessonId,
        pause: () => {
          if (!disposed && playerRef.current === player) player.pauseVideo();
        }
      };
      registerPlayerCommands(playerCommands);
      const duration = player.getDuration();
      if (duration && duration > 0) updateLessonDuration(lessonId, duration);
      timeStore.set(player.getCurrentTime?.() || 0, duration);
      setPlayerMuted(player.isMuted());
      player.setPlaybackRate(1);
      applyCaptionPreference(player, captionsEnabledRef.current);
      const requestedSeconds = pendingSeekRef.current;
      pendingSeekRef.current = null;
      const startSeconds = requestedSeconds === null
        ? getBoundedResumeSeconds(currentProgress, duration, activeLesson.startTimestamp || 0)
        : Math.max(0, Math.min(requestedSeconds, duration || requestedSeconds));
      player.seekTo(startSeconds, true);
      timeStore.set(startSeconds, duration);
      player.playVideo();
    };

    const initializePlayer = () => {
      if (disposed) return;
      const estimatedDuration = activeLesson.durationSeconds || 0;
      const startSeconds = getBoundedResumeSeconds(currentProgress, estimatedDuration, activeLesson.startTimestamp || 0);
      playerInstance = new window.YT.Player('yt-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: activeLesson.videoId || lessonId,
        playerVars: {
          start: startSeconds,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          autoplay: 1,
          cc_load_policy: captionsEnabledRef.current ? 1 : 0
        },
        events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    if (!window.YT) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializeTimer = setTimeout(initializePlayer, 50);
    }

    return () => {
      disposed = true;
      persistPlayer();
      stopTracking();
      if (initializeTimer) clearTimeout(initializeTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (window.onYouTubeIframeAPIReady === initializePlayer) window.onYouTubeIframeAPIReady = null;
      if (playerInstance) {
        try { playerInstance.destroy(); } catch {}
      }
      if (playerCommands) unregisterPlayerCommands(playerCommands);
      if (playerRef.current === playerInstance) playerRef.current = null;
      setYtPlayer(null);
      setIsPlaying(false);
    };
  }, [courseId, isPlayerTriggered, lessonId, registerPlayerCommands, setIsPlaying, unregisterPlayerCommands]);

  useEffect(() => () => {
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isPlayerTriggered) return;
    const handleKeyDown = event => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable || event.target.closest('button, a, summary, [role="slider"]')) return;
      const player = playerRef.current;
      switch (event.key) {
        case ' ': case 'k': case 'K':
          event.preventDefault();
          if (player) {
            if (isPlaying) player.pauseVideo();
            else player.playVideo();
          }
          break;
        case 'ArrowLeft': case 'j': case 'J': {
          event.preventDefault();
          if (player) {
            const time = Math.max(0, player.getCurrentTime() - 5);
            player.seekTo(time, true);
            timeStoreRef.current.set(time, player.getDuration());
          }
          break;
        }
        case 'ArrowRight': case 'l': case 'L': {
          event.preventDefault();
          if (player) {
            const time = Math.min(player.getDuration(), player.getCurrentTime() + 5);
            player.seekTo(time, true);
            timeStoreRef.current.set(time, player.getDuration());
          }
          break;
        }
        case 'm': case 'M':
          event.preventDefault();
          if (player) {
            if (playerMuted) { player.unMute(); setPlayerMuted(false); }
            else { player.mute(); setPlayerMuted(true); }
          }
          break;
        case 'f': case 'F':
          event.preventDefault();
          if (playerContainerRef.current) {
            if (document.fullscreenElement) document.exitFullscreen();
            else playerContainerRef.current.requestFullscreen();
          }
          break;
        case 'c': case 'C':
          event.preventDefault();
          if (player) setCaptionsEnabled(previous => {
            const next = !previous;
            applyCaptionPreference(player, next);
            return next;
          });
          break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerTriggered, isPlaying, playerMuted]);

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : -1;
      if (state === 1 || isPlaying) player.pauseVideo();
      else player.playVideo();
    } catch {}
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playerMuted) { player.unMute(); setPlayerMuted(false); }
    else { player.mute(); setPlayerMuted(true); }
  }, [playerMuted]);

  const handleSpeedCycle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setPlaybackSpeed(current => {
      const next = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(current) + 1) % SPEED_OPTIONS.length];
      player.setPlaybackRate(next);
      return next;
    });
  }, []);

  const handleQualityCycle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setQualityLevel(current => {
      const currentIndex = QUALITY_OPTIONS.findIndex(option => option.value === current);
      const next = QUALITY_OPTIONS[(currentIndex + 1) % QUALITY_OPTIONS.length];
      try { player.setPlaybackQuality(next.value); } catch {}
      return next.value;
    });
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) container.requestFullscreen().catch(error => console.error('Fullscreen Error:', error));
    else document.exitFullscreen();
  }, []);

  const handleCCToggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    setCaptionsEnabled(previous => {
      const next = !previous;
      applyCaptionPreference(player, next);
      return next;
    });
  }, []);

  const handleMouseMove = useCallback(() => {
    setIsControlsVisible(true);
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    mouseTimerRef.current = setTimeout(() => {
      if (useUIStore.getState().isPlaying) setIsControlsVisible(false);
    }, 800);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mouseTimerRef.current) clearTimeout(mouseTimerRef.current);
    if (useUIStore.getState().isPlaying) setIsControlsVisible(false);
  }, []);

  const handleProgressBarClick = useCallback(event => {
    const player = playerRef.current;
    if (!player || !progressBarRef.current) return;
    const duration = player.getDuration();
    if (!duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const seekSeconds = ((event.clientX - rect.left) / rect.width) * duration;
    player.seekTo(seekSeconds, true);
    timeStoreRef.current.set(seekSeconds, duration);
  }, []);

  const seekTo = useCallback(seconds => {
    const requestedSeconds = Math.max(0, Number(seconds) || 0);
    const player = playerRef.current;
    if (!player) {
      pendingSeekRef.current = requestedSeconds;
      setIsPlayerTriggered(true);
      return;
    }
    const duration = player.getDuration?.() || requestedSeconds;
    const boundedSeconds = Math.min(requestedSeconds, duration || requestedSeconds);
    player.seekTo(boundedSeconds, true);
    timeStoreRef.current.set(boundedSeconds, duration);
    player.playVideo();
  }, []);

  const getCurrentTime = useCallback(() => {
    try {
      return playerRef.current?.getCurrentTime?.() || 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    playerContainerRef,
    progressBarRef,
    ytPlayer,
    timeStore: timeStoreRef.current,
    isPlayerTriggered,
    setIsPlayerTriggered,
    playerMuted,
    playbackSpeed,
    qualityLevel,
    captionsEnabled,
    isControlsVisible,
    isPlaying,
    triggerPlayerSeek: seekTo,
    getCurrentTime,
    handlePlayPause,
    handleMuteToggle,
    handleSpeedCycle,
    handleQualityCycle,
    handleFullscreenToggle,
    handleCCToggle,
    handleMouseMove,
    handleMouseLeave,
    handleProgressBarClick
  };
}
