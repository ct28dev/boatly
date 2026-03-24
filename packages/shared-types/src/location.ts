/**
 * Represents a pier (departure/arrival point for boat tours).
 */
export interface Pier {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name of the pier */
  name: string;
  /** Thai language name */
  name_th: string | null;
  /** Full address of the pier */
  address: string | null;
  /** Province where the pier is located */
  province: string;
  /** District within the province */
  district: string | null;
  /** GPS latitude */
  latitude: number;
  /** GPS longitude */
  longitude: number;
  /** URL to a photo of the pier */
  image_url: string | null;
  /** Facilities available (e.g., parking, restrooms, shops) */
  facilities: string[];
  /** Operating hours description */
  operating_hours: string | null;
  /** Contact phone number */
  phone: string | null;
  /** Whether this pier is currently active */
  is_active: boolean;
  /** ISO 8601 timestamp of creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Represents a Thai province where tours are offered.
 */
export interface Province {
  /** Unique identifier (UUID) */
  id: string;
  /** Province name in English */
  name: string;
  /** Province name in Thai */
  name_th: string;
  /** Region grouping (e.g., Southern, Eastern, Central) */
  region: string;
  /** URL to a representative image */
  image_url: string | null;
  /** Whether there are active tours in this province */
  is_active: boolean;
}

/**
 * Defines a geographic area where a provider offers services.
 */
export interface ServiceArea {
  /** Unique identifier (UUID) */
  id: string;
  /** Provider this service area belongs to */
  provider_id: string;
  /** Province covered */
  province: string;
  /** Specific districts within the province, empty = entire province */
  districts: string[];
  /** Whether this service area is currently active */
  is_active: boolean;
  /** ISO 8601 timestamp of creation */
  created_at: string;
}
