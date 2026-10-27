import { create } from 'zustand';

/**
 * Zustand Store for Ephemeral UI State only.
 * Persistent domain data remains strictly in Dexie/IndexedDB.
 */
export const useUIStore = create((set, get) => ({
  // Active states for the video watch player
  activeLessonId: null,
  isPlaying: false,
  seekRequestTime: null, // Set to a timestamp in seconds to trigger player seek
  activePlayerCommands: null,
  
  // Feedback Modal global state
  betaModalOpen: false,
  openBetaModal: () => set({ betaModalOpen: true }),
  closeBetaModal: () => set({ betaModalOpen: false }),

  feedbackModalOpen: false,
  openFeedbackModal: () => set({ feedbackModalOpen: true }),
  closeFeedbackModal: () => set({ feedbackModalOpen: false }),

  // Auth Modal global state
  authModalOpen: false,
  authModalContext: 'default',
  openAuthModal: (context = 'default') => set({ authModalOpen: true, authModalContext: context }),
  closeAuthModal: () => set({ authModalOpen: false }),

  // Command Palette global state
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  
  // Importer state
  isImporting: false,
  importError: null,

  // Setters
  setActiveLessonId: (id) => set({ activeLessonId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  triggerPlayerSeek: (seconds) => set({ seekRequestTime: seconds }),
  registerPlayerCommands: commands => set({ activePlayerCommands: commands }),
  unregisterPlayerCommands: commands => set(state => (
    state.activePlayerCommands === commands ? { activePlayerCommands: null } : {}
  )),
  pauseActivePlayer: () => {
    const commands = get().activePlayerCommands;
    if (!commands || commands.lessonId !== get().activeLessonId) return false;
    commands.pause();
    return true;
  },
  setIsImporting: (status) => set({ isImporting: status }),
  setImportError: (err) => set({ importError: err }),
  
  // Reset watch state
  resetPlayerState: () => set({ activeLessonId: null, isPlaying: false, seekRequestTime: null, activePlayerCommands: null })
}));
