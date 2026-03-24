import { create } from 'zustand';

/** Global booking draft — sync กับหน้า /booking และ flow จอง */
export type BookingDraft = {
  tourId?: string;
  tourName?: string;
  location?: string;
  date?: string;
  time?: string;
  passengers?: { adult: number; child: number; infant: number };
  paymentMethod?: 'qr' | 'card' | 'cod';
};

type UserLite = {
  id?: string;
  name?: string;
  email?: string;
} | null;

type AppState = {
  user: UserLite;
  booking: BookingDraft;
  setUser: (user: UserLite) => void;
  setBooking: (data: Partial<BookingDraft>) => void;
  resetBooking: () => void;
};

export const useStore = create<AppState>((set) => ({
  user: null,
  booking: {},
  setUser: (user) => set({ user }),
  setBooking: (data) =>
    set((state) => ({
      booking: { ...state.booking, ...data },
    })),
  resetBooking: () => set({ booking: {} }),
}));
