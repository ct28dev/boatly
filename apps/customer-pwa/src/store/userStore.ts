import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/services/authService';

interface UserState {
  user: UserProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  favorites: string[];

  setUser: (user: UserProfile | null) => void;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
  addFavorite: (tourId: string) => void;
  removeFavorite: (tourId: string) => void;
  toggleFavorite: (tourId: string) => void;
  isFavorite: (tourId: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      favorites: [],

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
        }),

      setToken: (token, refreshToken) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
          isAuthenticated: true,
        })),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      addFavorite: (tourId) =>
        set((state) => ({
          favorites: state.favorites.includes(tourId)
            ? state.favorites
            : [...state.favorites, tourId],
        })),

      removeFavorite: (tourId) =>
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== tourId),
        })),

      toggleFavorite: (tourId) => {
        const { favorites } = get();
        if (favorites.includes(tourId)) {
          set({ favorites: favorites.filter((id) => id !== tourId) });
        } else {
          set({ favorites: [...favorites, tourId] });
        }
      },

      isFavorite: (tourId) => get().favorites.includes(tourId),
    }),
    {
      name: 'boatly-user',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        favorites: state.favorites,
      }),
    }
  )
);
