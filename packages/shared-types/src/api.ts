/**
 * Standard API response wrapper used by all endpoints.
 * @template T - The type of the response payload
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response payload, present when success is true */
  data?: T;
  /** Error details, present when success is false */
  error?: ApiError;
  /** Human-readable status message */
  message?: string;
}

/**
 * Paginated API response for list endpoints.
 * @template T - The type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    limit: number;
    /** Total number of items across all pages */
    total: number;
    /** Total number of pages */
    total_pages: number;
    /** Whether there is a next page */
    has_next: boolean;
    /** Whether there is a previous page */
    has_previous: boolean;
  };
}

/**
 * Structured error object returned by the API.
 */
export interface ApiError {
  /** Machine-readable error code (e.g., "BOOKING_NOT_FOUND") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Detailed field-level validation errors */
  details?: Record<string, string[]>;
  /** HTTP status code */
  status_code: number;
}

/**
 * Common query parameters for paginated list endpoints.
 */
export interface PaginationQuery {
  /** Page number to retrieve (1-indexed, default: 1) */
  page?: number;
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Field name to sort by */
  sort_by?: string;
  /** Sort direction */
  sort_order?: 'asc' | 'desc';
  /** Full-text search query string */
  search?: string;
}
