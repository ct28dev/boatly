import { BoatType } from './boat';

/**
 * Represents a tour product listed on the platform.
 * A "product" is a bookable tour experience offered by a provider.
 */
export interface Tour {
  /** Unique identifier (UUID) */
  id: string;
  /** Provider offering this tour */
  provider_id: string;
  /** Boat assigned to this tour, null if not yet assigned */
  boat_id: string | null;
  /** Display title of the tour */
  title: string;
  /** Short summary for listings */
  summary: string | null;
  /** Full HTML or markdown description */
  description: string;
  /** Type of boat used for this tour */
  boat_type: BoatType;
  /** Tour duration in minutes */
  duration_minutes: number;
  /** Maximum number of passengers per departure */
  max_passengers: number;
  /** Base price per adult in Thai Baht */
  price_adult: number;
  /** Price per child in Thai Baht */
  price_child: number;
  /** Price per infant in Thai Baht (often 0) */
  price_infant: number;
  /** Departure pier ID */
  departure_pier_id: string;
  /** Province where the tour operates */
  province: string;
  /** Whether the tour is currently published and bookable */
  is_active: boolean;
  /** Whether the tour is featured/promoted on the homepage */
  is_featured: boolean;
  /** Average rating from customer reviews (1-5) */
  average_rating: number;
  /** Total number of reviews */
  total_reviews: number;
  /** Total number of completed bookings */
  total_bookings: number;
  /** Items included in the tour (e.g., lunch, snorkeling gear) */
  inclusions: string[];
  /** Items not included (e.g., national park fee) */
  exclusions: string[];
  /** Important notes or requirements for passengers */
  highlights: string[];
  /** Cancellation policy text */
  cancellation_policy: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * An image associated with a tour product.
 */
export interface ProductImage {
  /** Unique identifier (UUID) */
  id: string;
  /** Tour this image belongs to */
  tour_id: string;
  /** Full URL to the image */
  image_url: string;
  /** Alt text for accessibility */
  alt_text: string | null;
  /** Display order (lower = first) */
  sort_order: number;
  /** Whether this is the primary/cover image */
  is_primary: boolean;
  /** ISO 8601 timestamp of upload */
  created_at: string;
}

/**
 * Association between a tour and a pier it visits.
 */
export interface ProductPier {
  /** Unique identifier (UUID) */
  id: string;
  /** Tour this pier stop belongs to */
  tour_id: string;
  /** Pier being visited */
  pier_id: string;
  /** Order of this stop in the tour itinerary */
  stop_order: number;
  /** Whether this pier is the departure point */
  is_departure: boolean;
  /** Estimated arrival time at this pier (HH:mm format) */
  arrival_time: string | null;
  /** Duration of the stop in minutes */
  duration_minutes: number | null;
}

/**
 * A scheduled departure time for a tour on specific days.
 */
export interface ProductSchedule {
  /** Unique identifier (UUID) */
  id: string;
  /** Tour this schedule belongs to */
  tour_id: string;
  /** Departure time in HH:mm format */
  departure_time: string;
  /** Days of the week this schedule is active (0=Sunday, 6=Saturday) */
  days_of_week: number[];
  /** ISO 8601 date from which this schedule is valid */
  valid_from: string;
  /** ISO 8601 date until which this schedule is valid, null if open-ended */
  valid_until: string | null;
  /** Whether this schedule is currently active */
  is_active: boolean;
  /** Maximum passengers for this specific departure, overrides tour default */
  max_passengers: number | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}
