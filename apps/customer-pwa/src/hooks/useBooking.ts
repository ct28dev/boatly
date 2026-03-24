import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBookingStore, BOOKING_STEPS, type BookingStep } from '@/store/bookingStore';
import bookingService, {
  type CreateBookingRequest,
  type Passenger,
} from '@/services/bookingService';
import type { Tour, TourSchedule } from '@/services/tourService';

export function useBooking() {
  const queryClient = useQueryClient();
  const store = useBookingStore();

  const progress = useMemo(() => {
    const totalSteps = BOOKING_STEPS.length;
    return {
      current: store.stepIndex + 1,
      total: totalSteps,
      percentage: ((store.stepIndex + 1) / totalSteps) * 100,
      isFirst: store.stepIndex === 0,
      isLast: store.stepIndex === totalSteps - 1,
    };
  }, [store.stepIndex]);

  const availabilityQuery = useQuery({
    queryKey: ['availability', store.selectedTour?.id, store.selectedDate],
    queryFn: () =>
      bookingService.checkAvailability(
        store.selectedTour!.id,
        store.selectedDate!,
        store.passengers.length
      ),
    enabled: !!store.selectedTour?.id && !!store.selectedDate,
    staleTime: 30 * 1000,
  });

  const createBookingMutation = useMutation({
    mutationFn: (data: CreateBookingRequest) => bookingService.createBooking(data),
    onSuccess: (booking) => {
      store.setBookingResult(booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.confirmBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const startBooking = useCallback(
    (tour: Tour) => {
      store.reset();
      store.setTour(tour);
    },
    [store]
  );

  const selectDate = useCallback(
    (date: string) => {
      store.setDate(date);
    },
    [store]
  );

  const selectTime = useCallback(
    (schedule: TourSchedule) => {
      store.setTime(schedule);
    },
    [store]
  );

  const updatePassengers = useCallback(
    (passengers: Passenger[]) => {
      store.setPassengers(passengers);
    },
    [store]
  );

  const next = useCallback(() => {
    if (store.canProceed()) {
      store.nextStep();
    }
  }, [store]);

  const back = useCallback(() => {
    store.prevStep();
  }, [store]);

  const goTo = useCallback(
    (step: BookingStep) => {
      const targetIndex = BOOKING_STEPS.indexOf(step);
      if (targetIndex <= store.stepIndex) {
        store.goToStep(step);
      }
    },
    [store]
  );

  const submitBooking = useCallback(async () => {
    if (!store.selectedTour || !store.selectedDate || !store.selectedTime) {
      throw new Error('Missing required booking data');
    }

    store.setIsProcessing(true);

    try {
      const request: CreateBookingRequest = {
        tourId: store.selectedTour.id,
        scheduleId: store.selectedTime.id,
        date: store.selectedDate,
        passengers: store.passengers,
        specialRequests: store.specialRequests || undefined,
        promoCode: store.promoCode || undefined,
        contactPhone: store.contactPhone,
        contactEmail: store.contactEmail,
      };

      const booking = await createBookingMutation.mutateAsync(request);
      return booking;
    } finally {
      store.setIsProcessing(false);
    }
  }, [store, createBookingMutation]);

  const pricing = useMemo(() => {
    if (!store.selectedTour) return null;

    const adultCount = store.passengers.filter((p) => !p.isChild).length;
    const childCount = store.passengers.filter((p) => p.isChild).length;
    const adultPrice = store.selectedTour.price;
    const childPrice = Math.round(store.selectedTour.price * 0.5);
    const subtotal = adultCount * adultPrice + childCount * childPrice;

    return {
      adultCount,
      childCount,
      adultPrice,
      childPrice,
      subtotal,
      currency: store.selectedTour.currency || 'THB',
    };
  }, [store.selectedTour, store.passengers]);

  return {
    currentStep: store.currentStep,
    stepIndex: store.stepIndex,
    steps: BOOKING_STEPS,
    progress,
    tour: store.selectedTour,
    selectedDate: store.selectedDate,
    selectedTime: store.selectedTime,
    passengers: store.passengers,
    specialRequests: store.specialRequests,
    promoCode: store.promoCode,
    contactPhone: store.contactPhone,
    contactEmail: store.contactEmail,
    bookingResult: store.bookingResult,
    isProcessing: store.isProcessing,
    pricing,

    availability: availabilityQuery.data,
    isCheckingAvailability: availabilityQuery.isLoading,

    startBooking,
    selectDate,
    selectTime,
    updatePassengers,
    setSpecialRequests: store.setSpecialRequests,
    setPromoCode: store.setPromoCode,
    setContactPhone: store.setContactPhone,
    setContactEmail: store.setContactEmail,

    next,
    back,
    goTo,
    canProceed: store.canProceed,

    submitBooking,
    isSubmitting: createBookingMutation.isPending,
    submitError: createBookingMutation.error,

    confirmBooking: confirmBookingMutation.mutateAsync,
    isConfirming: confirmBookingMutation.isPending,

    reset: store.reset,
  };
}
