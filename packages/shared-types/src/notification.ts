/**
 * Category of notification sent to users.
 */
export enum NotificationType {
  /** Booking-related updates (confirmation, cancellation, etc.) */
  BOOKING = 'booking',
  /** Payment-related updates (received, refunded, etc.) */
  PAYMENT = 'payment',
  /** Review-related updates (new review, response, moderation) */
  REVIEW = 'review',
  /** Promotional messages and offers */
  PROMOTION = 'promotion',
  /** System announcements and alerts */
  SYSTEM = 'system',
}

/**
 * Represents an in-app notification sent to a user.
 */
export interface Notification {
  /** Unique identifier (UUID) */
  id: string;
  /** User who receives this notification */
  user_id: string;
  /** Category of the notification */
  type: NotificationType;
  /** Notification headline */
  title: string;
  /** Notification body text */
  message: string;
  /** Optional JSON metadata (e.g., booking_id, tour_id) */
  data: Record<string, unknown> | null;
  /** Deep link URL to navigate to when tapped */
  action_url: string | null;
  /** Whether the user has read this notification */
  is_read: boolean;
  /** ISO 8601 timestamp when the notification was read */
  read_at: string | null;
  /** ISO 8601 timestamp of creation */
  created_at: string;
}
