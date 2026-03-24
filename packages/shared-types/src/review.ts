/**
 * Moderation status of a customer review.
 */
export enum ReviewStatus {
  /** Awaiting moderator approval */
  PENDING = 'pending',
  /** Approved and visible to the public */
  APPROVED = 'approved',
  /** Rejected by moderator */
  REJECTED = 'rejected',
}

/**
 * Represents a customer review for a completed tour.
 */
export interface Review {
  /** Unique identifier (UUID) */
  id: string;
  /** Booking this review is associated with */
  booking_id: string;
  /** Customer who wrote the review */
  user_id: string;
  /** Tour being reviewed */
  tour_id: string;
  /** Provider of the tour */
  provider_id: string;
  /** Overall rating (1-5 stars) */
  rating: number;
  /** Written review text */
  comment: string | null;
  /** Current moderation status */
  status: ReviewStatus;
  /** Provider's public response to the review */
  provider_response: string | null;
  /** ISO 8601 timestamp of provider's response */
  provider_response_at: string | null;
  /** Whether the review has been flagged for moderation */
  is_flagged: boolean;
  /** Reason the review was flagged */
  flag_reason: string | null;
  /** ISO 8601 timestamp of review submission */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * An image attached to a review by the customer.
 */
export interface ReviewImage {
  /** Unique identifier (UUID) */
  id: string;
  /** Review this image belongs to */
  review_id: string;
  /** Full URL to the image */
  image_url: string;
  /** Display order (lower = first) */
  sort_order: number;
  /** ISO 8601 timestamp of upload */
  created_at: string;
}
