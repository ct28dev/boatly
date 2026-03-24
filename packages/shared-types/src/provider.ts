/**
 * Approval status of a service provider on the platform.
 */
export enum ProviderStatus {
  /** Awaiting admin review */
  PENDING = 'pending',
  /** Approved and active */
  APPROVED = 'approved',
  /** Temporarily or permanently suspended */
  SUSPENDED = 'suspended',
}

/**
 * Represents a boat tour service provider (business entity).
 */
export interface Provider {
  /** Unique identifier (UUID) */
  id: string;
  /** User ID of the provider owner */
  user_id: string;
  /** Registered company or business name */
  company_name: string;
  /** Business description */
  description: string | null;
  /** Business registration / tax ID number */
  tax_id: string | null;
  /** Business contact phone number */
  phone: string;
  /** Business contact email */
  email: string;
  /** Business street address */
  address: string | null;
  /** Province where the business is registered */
  province: string | null;
  /** URL to the company logo image */
  logo_url: string | null;
  /** URL to the business license document */
  license_url: string | null;
  /** Current approval status */
  status: ProviderStatus;
  /** Average rating from customer reviews (1-5) */
  average_rating: number;
  /** Total number of reviews received */
  total_reviews: number;
  /** Whether the provider's bank account info is verified */
  bank_verified: boolean;
  /** Bank account name for payouts */
  bank_account_name: string | null;
  /** Bank account number for payouts */
  bank_account_number: string | null;
  /** Bank name for payouts */
  bank_name: string | null;
  /** ISO 8601 timestamp of registration */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}
