/**
 * Type of discount applied by a promotion.
 */
export enum DiscountType {
  /** Fixed amount discount in Thai Baht */
  FIXED = 'fixed',
  /** Percentage-based discount */
  PERCENTAGE = 'percentage',
}

/**
 * Represents a promotional offer or coupon code.
 */
export interface Promotion {
  /** Unique identifier (UUID) */
  id: string;
  /** Provider offering this promotion, null for platform-wide promotions */
  provider_id: string | null;
  /** Coupon code the customer enters */
  code: string;
  /** Human-readable promotion title */
  title: string;
  /** Description of the promotion terms */
  description: string | null;
  /** How the discount is calculated */
  discount_type: DiscountType;
  /** Discount value (amount in Baht for fixed, percentage for percentage) */
  discount_value: number;
  /** Maximum discount amount in Baht (caps percentage discounts) */
  max_discount: number | null;
  /** Minimum booking subtotal required to use this promotion */
  min_purchase: number | null;
  /** Maximum number of times this promotion can be redeemed in total */
  usage_limit: number | null;
  /** Number of times this promotion has been used */
  usage_count: number;
  /** Maximum uses per individual customer */
  per_user_limit: number;
  /** ISO 8601 date when the promotion becomes active */
  valid_from: string;
  /** ISO 8601 date when the promotion expires */
  valid_until: string;
  /** Whether the promotion is currently active */
  is_active: boolean;
  /** Specific tour IDs this promotion applies to, empty = all tours */
  applicable_tour_ids: string[];
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}
