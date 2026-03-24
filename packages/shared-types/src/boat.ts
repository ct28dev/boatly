/**
 * Classification of boat types available on the platform.
 */
export enum BoatType {
  SPEEDBOAT = 'speedboat',
  LONGTAIL = 'longtail',
  CATAMARAN = 'catamaran',
  YACHT = 'yacht',
  FERRY = 'ferry',
}

/**
 * Operational status of a boat.
 */
export enum BoatStatus {
  /** Ready to accept bookings */
  AVAILABLE = 'available',
  /** Under repair or scheduled maintenance */
  MAINTENANCE = 'maintenance',
  /** Permanently decommissioned */
  RETIRED = 'retired',
}

/**
 * Represents a boat registered by a provider.
 */
export interface Boat {
  /** Unique identifier (UUID) */
  id: string;
  /** Provider who owns this boat */
  provider_id: string;
  /** Display name of the boat */
  name: string;
  /** Detailed description */
  description: string | null;
  /** Classification type */
  type: BoatType;
  /** Current operational status */
  status: BoatStatus;
  /** Official registration number */
  registration_number: string;
  /** Maximum passenger capacity */
  capacity: number;
  /** Year the boat was manufactured */
  year_built: number | null;
  /** Length of the boat in meters */
  length_meters: number | null;
  /** URL to the main boat image */
  image_url: string | null;
  /** Whether the boat has passed a safety inspection */
  safety_certified: boolean;
  /** ISO 8601 date when the safety certificate expires */
  safety_certificate_expiry: string | null;
  /** ISO 8601 timestamp of registration on the platform */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * A crew member assigned to a boat.
 */
export interface BoatCrew {
  /** Unique identifier (UUID) */
  id: string;
  /** Boat this crew member is assigned to */
  boat_id: string;
  /** Full name of the crew member */
  full_name: string;
  /** Role on the boat (e.g., captain, guide, engineer) */
  role: string;
  /** License or certification number */
  license_number: string | null;
  /** Thai phone number */
  phone: string | null;
  /** URL to a profile photo */
  photo_url: string | null;
  /** Whether this crew member is currently active */
  is_active: boolean;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Real-time or last-known GPS location of a boat.
 */
export interface BoatLocation {
  /** Unique identifier (UUID) */
  id: string;
  /** Boat this location belongs to */
  boat_id: string;
  /** GPS latitude */
  latitude: number;
  /** GPS longitude */
  longitude: number;
  /** Speed in knots, null if stationary or unknown */
  speed_knots: number | null;
  /** Compass heading in degrees (0-360) */
  heading: number | null;
  /** ISO 8601 timestamp when this position was recorded */
  recorded_at: string;
}
