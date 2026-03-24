/**
 * Lifecycle status of a booking.
 */
export enum BookingStatus {
  /** Booking created, awaiting payment */
  PENDING = 'pending',
  /** Payment received, booking confirmed */
  CONFIRMED = 'confirmed',
  /** Passenger(s) checked in at the pier */
  CHECKED_IN = 'checked_in',
  /** Tour completed successfully */
  COMPLETED = 'completed',
  /** Booking was cancelled */
  CANCELLED = 'cancelled',
}

/**
 * Classification of passenger by age group, affects pricing.
 */
export enum PassengerType {
  /** Age 12 and above */
  ADULT = 'adult',
  /** Age 3-11 */
  CHILD = 'child',
  /** Age 0-2, typically free or reduced */
  INFANT = 'infant',
}

/**
 * Represents a tour booking made by a customer.
 */
export interface Booking {
  /** Unique identifier (UUID) */
  id: string;
  /** Reference code displayed to the customer (e.g., BH-20260309-XXXX) */
  booking_reference: string;
  /** Customer who made the booking */
  user_id: string;
  /** Tour being booked */
  tour_id: string;
  /** Provider offering the tour */
  provider_id: string;
  /** Schedule slot selected for this booking */
  schedule_id: string;
  /** ISO 8601 date of the tour departure */
  booking_date: string;
  /** Departure time in HH:mm format */
  departure_time: string;
  /** Number of adult passengers */
  adult_count: number;
  /** Number of child passengers */
  child_count: number;
  /** Number of infant passengers */
  infant_count: number;
  /** Total price before discounts in Thai Baht */
  subtotal: number;
  /** Discount amount applied in Thai Baht */
  discount_amount: number;
  /** Final total after discounts in Thai Baht */
  total_amount: number;
  /** Promotion code applied, if any */
  promotion_id: string | null;
  /** Current booking lifecycle status */
  status: BookingStatus;
  /** Special requests or notes from the customer */
  special_requests: string | null;
  /** Reason for cancellation, if cancelled */
  cancellation_reason: string | null;
  /** ISO 8601 timestamp when the booking was cancelled */
  cancelled_at: string | null;
  /** Contact name for this booking */
  contact_name: string;
  /** Contact email for this booking */
  contact_email: string;
  /** Contact phone for this booking */
  contact_phone: string;
  /** ISO 8601 timestamp of booking creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Individual passenger details within a booking.
 */
export interface BookingPassenger {
  /** Unique identifier (UUID) */
  id: string;
  /** Booking this passenger belongs to */
  booking_id: string;
  /** Passenger's full name */
  full_name: string;
  /** Age group classification */
  passenger_type: PassengerType;
  /** Age at time of booking */
  age: number | null;
  /** Nationality (ISO 3166-1 alpha-2 code) */
  nationality: string | null;
  /** Passport or ID number, required for some tours */
  id_number: string | null;
  /** Special requirements (dietary, medical, accessibility) */
  special_requirements: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
}

/**
 * Check-in record for a booking at the departure pier.
 */
export interface BookingCheckin {
  /** Unique identifier (UUID) */
  id: string;
  /** Booking being checked in */
  booking_id: string;
  /** Staff member or provider user who performed the check-in */
  checked_in_by: string;
  /** Number of passengers actually checked in */
  passenger_count: number;
  /** Any notes recorded during check-in */
  notes: string | null;
  /** ISO 8601 timestamp of check-in */
  checked_in_at: string;
}
