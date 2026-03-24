import apiClient from './apiClient';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Passenger {
  firstName: string;
  lastName: string;
  age?: number;
  nationality?: string;
  idNumber?: string;
  isChild: boolean;
}

export interface CreateBookingRequest {
  tourId: string;
  scheduleId: string;
  date: string;
  passengers: Passenger[];
  specialRequests?: string;
  promoCode?: string;
  contactPhone: string;
  contactEmail: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  tourId: string;
  tourName: string;
  tourImage: string;
  scheduleId: string;
  date: string;
  departureTime: string;
  returnTime: string;
  passengers: Passenger[];
  adultCount: number;
  childCount: number;
  specialRequests?: string;
  status: BookingStatus;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  promoCode?: string;
  departure: {
    pierId: string;
    pierName: string;
    lat: number;
    lng: number;
  };
  operatorId: string;
  operatorName: string;
  paymentId?: string;
  checkinTime?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityResponse {
  available: boolean;
  remainingSeats: number;
  price: number;
  schedules: Array<{
    id: string;
    departureTime: string;
    returnTime: string;
    availableSeats: number;
  }>;
}

const bookingService = {
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const { data: response } = await apiClient.post<{ data: Booking }>('/bookings', data);
    return response.data;
  },

  async getBooking(id: string): Promise<Booking> {
    const { data } = await apiClient.get<{ data: Booking }>(`/bookings/${id}`);
    return data.data;
  },

  async getUserBookings(status?: BookingStatus, page = 1, limit = 10): Promise<{ bookings: Booking[]; total: number }> {
    const { data } = await apiClient.get<{ data: { bookings: Booking[]; total: number } }>('/bookings/my', {
      params: { status, page, limit },
    });
    return data.data;
  },

  async checkAvailability(tourId: string, date: string, passengers?: number): Promise<AvailabilityResponse> {
    const { data } = await apiClient.get<{ data: AvailabilityResponse }>(`/tours/${tourId}/availability`, {
      params: { date, passengers },
    });
    return data.data;
  },

  async addPassengers(bookingId: string, passengers: Passenger[]): Promise<Booking> {
    const { data } = await apiClient.put<{ data: Booking }>(
      `/bookings/${bookingId}/passengers`,
      { passengers }
    );
    return data.data;
  },

  async addRequest(bookingId: string, text: string): Promise<Booking> {
    const { data } = await apiClient.patch<{ data: Booking }>(
      `/bookings/${bookingId}/requests`,
      { specialRequests: text }
    );
    return data.data;
  },

  async confirmBooking(bookingId: string): Promise<Booking> {
    const { data } = await apiClient.post<{ data: Booking }>(`/bookings/${bookingId}/confirm`);
    return data.data;
  },

  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    const { data } = await apiClient.post<{ data: Booking }>(
      `/bookings/${bookingId}/cancel`,
      { reason }
    );
    return data.data;
  },

  async checkin(bookingId: string, pierId: string): Promise<Booking> {
    const { data } = await apiClient.post<{ data: Booking }>(
      `/bookings/${bookingId}/checkin`,
      { pierId }
    );
    return data.data;
  },

  async getBookingQR(bookingId: string): Promise<string> {
    const { data } = await apiClient.get<{ data: { qrCode: string } }>(
      `/bookings/${bookingId}/qr`
    );
    return data.data.qrCode;
  },
};

export default bookingService;
