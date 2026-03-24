import { create } from 'zustand';
import type { Tour, TourSchedule } from '@/services/tourService';
import type { Passenger, Booking } from '@/services/bookingService';

export type BookingStep = 'date' | 'time' | 'passengers' | 'requests' | 'summary' | 'payment';

const BOOKING_STEPS: BookingStep[] = ['date', 'time', 'passengers', 'requests', 'summary', 'payment'];

interface BookingState {
  currentStep: BookingStep;
  stepIndex: number;
  selectedTour: Tour | null;
  selectedDate: string | null;
  selectedTime: TourSchedule | null;
  passengers: Passenger[];
  specialRequests: string;
  promoCode: string;
  contactPhone: string;
  contactEmail: string;
  bookingResult: Booking | null;
  isProcessing: boolean;

  setTour: (tour: Tour) => void;
  setDate: (date: string) => void;
  setTime: (schedule: TourSchedule) => void;
  setPassengers: (passengers: Passenger[]) => void;
  addPassenger: (passenger: Passenger) => void;
  removePassenger: (index: number) => void;
  updatePassenger: (index: number, passenger: Passenger) => void;
  setSpecialRequests: (requests: string) => void;
  setPromoCode: (code: string) => void;
  setContactPhone: (phone: string) => void;
  setContactEmail: (email: string) => void;
  setBookingResult: (booking: Booking) => void;
  setIsProcessing: (processing: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: BookingStep) => void;
  reset: () => void;
  canProceed: () => boolean;
}

const initialState = {
  currentStep: 'date' as BookingStep,
  stepIndex: 0,
  selectedTour: null,
  selectedDate: null,
  selectedTime: null,
  passengers: [{ firstName: '', lastName: '', isChild: false }] as Passenger[],
  specialRequests: '',
  promoCode: '',
  contactPhone: '',
  contactEmail: '',
  bookingResult: null,
  isProcessing: false,
};

export const useBookingStore = create<BookingState>()((set, get) => ({
  ...initialState,

  setTour: (tour) => set({ selectedTour: tour }),

  setDate: (date) => set({ selectedDate: date, selectedTime: null }),

  setTime: (schedule) => set({ selectedTime: schedule }),

  setPassengers: (passengers) => set({ passengers }),

  addPassenger: (passenger) =>
    set((state) => ({ passengers: [...state.passengers, passenger] })),

  removePassenger: (index) =>
    set((state) => ({
      passengers: state.passengers.filter((_, i) => i !== index),
    })),

  updatePassenger: (index, passenger) =>
    set((state) => ({
      passengers: state.passengers.map((p, i) => (i === index ? passenger : p)),
    })),

  setSpecialRequests: (requests) => set({ specialRequests: requests }),

  setPromoCode: (code) => set({ promoCode: code }),

  setContactPhone: (phone) => set({ contactPhone: phone }),

  setContactEmail: (email) => set({ contactEmail: email }),

  setBookingResult: (booking) => set({ bookingResult: booking }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  nextStep: () => {
    const { stepIndex } = get();
    if (stepIndex < BOOKING_STEPS.length - 1) {
      const nextIndex = stepIndex + 1;
      set({ stepIndex: nextIndex, currentStep: BOOKING_STEPS[nextIndex] });
    }
  },

  prevStep: () => {
    const { stepIndex } = get();
    if (stepIndex > 0) {
      const prevIndex = stepIndex - 1;
      set({ stepIndex: prevIndex, currentStep: BOOKING_STEPS[prevIndex] });
    }
  },

  goToStep: (step) => {
    const index = BOOKING_STEPS.indexOf(step);
    if (index !== -1) {
      set({ stepIndex: index, currentStep: step });
    }
  },

  reset: () => set(initialState),

  canProceed: () => {
    const state = get();
    switch (state.currentStep) {
      case 'date':
        return state.selectedDate !== null;
      case 'time':
        return state.selectedTime !== null;
      case 'passengers':
        return (
          state.passengers.length > 0 &&
          state.passengers.every((p) => p.firstName.trim() !== '' && p.lastName.trim() !== '')
        );
      case 'requests':
        return true;
      case 'summary':
        return state.contactPhone.trim() !== '' && state.contactEmail.trim() !== '';
      case 'payment':
        return false;
      default:
        return false;
    }
  },
}));

export { BOOKING_STEPS };
