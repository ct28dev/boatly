/**
 * User roles within the BOATLY platform.
 */
export enum UserRole {
  /** Regular customer who books tours */
  CUSTOMER = 'customer',
  /** Tour/boat service provider */
  PROVIDER = 'provider',
  /** Platform administrator */
  ADMIN = 'admin',
}

/**
 * Represents a registered user on the platform.
 */
export interface User {
  /** Unique identifier (UUID) */
  id: string;
  /** User's email address */
  email: string;
  /** User's full name */
  full_name: string;
  /** Thai phone number */
  phone: string;
  /** URL to the user's profile image */
  profile_image_url: string | null;
  /** Role assigned to this user */
  role: UserRole;
  /** Whether the user's email has been verified */
  email_verified: boolean;
  /** Whether the user's phone has been verified */
  phone_verified: boolean;
  /** ISO 8601 timestamp of account creation */
  created_at: string;
  /** ISO 8601 timestamp of last profile update */
  updated_at: string;
  /** ISO 8601 timestamp of last login, null if never logged in */
  last_login_at: string | null;
}

/**
 * Authentication payload returned after successful login or registration.
 */
export interface UserAuth {
  /** JWT access token */
  access_token: string;
  /** JWT refresh token */
  refresh_token: string;
  /** Token expiry duration in seconds */
  expires_in: number;
  /** Token type, typically "Bearer" */
  token_type: string;
  /** Authenticated user profile */
  user: User;
}
