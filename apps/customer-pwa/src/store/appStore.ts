import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AppState {
  isOnline: boolean;
  isPWAInstalled: boolean;
  showInstallPrompt: boolean;
  deferredInstallPrompt: BeforeInstallPromptEvent | null;
  isLoading: boolean;
  error: string | null;

  setOnline: (online: boolean) => void;
  setPWAInstalled: (installed: boolean) => void;
  setShowInstallPrompt: (show: boolean) => void;
  setDeferredInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  triggerInstall: () => Promise<boolean>;
  initListeners: () => () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isPWAInstalled: false,
  showInstallPrompt: false,
  deferredInstallPrompt: null,
  isLoading: false,
  error: null,

  setOnline: (online) => set({ isOnline: online }),

  setPWAInstalled: (installed) =>
    set({ isPWAInstalled: installed, showInstallPrompt: false }),

  setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),

  setDeferredInstallPrompt: (event) =>
    set({ deferredInstallPrompt: event, showInstallPrompt: event !== null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  triggerInstall: async () => {
    const { deferredInstallPrompt } = get();
    if (!deferredInstallPrompt) return false;

    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;

      if (outcome === 'accepted') {
        set({
          isPWAInstalled: true,
          showInstallPrompt: false,
          deferredInstallPrompt: null,
        });
        return true;
      }
    } catch {
      // User dismissed or error
    }

    set({ showInstallPrompt: false, deferredInstallPrompt: null });
    return false;
  },

  initListeners: () => {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      set({
        deferredInstallPrompt: e as BeforeInstallPromptEvent,
        showInstallPrompt: true,
      });
    };

    const handleAppInstalled = () => {
      set({
        isPWAInstalled: true,
        showInstallPrompt: false,
        deferredInstallPrompt: null,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    if (isStandalone) {
      set({ isPWAInstalled: true });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  },
}));
