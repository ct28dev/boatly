import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  ReviewStatus,
  ProviderStatus,
  BoatStatus,
  BoatType,
  UserRole,
  PassengerType,
  NotificationType,
  DiscountType,
} from '@boatly/shared-types';

// ---------------------------------------------------------------------------
// API Base Paths
// ---------------------------------------------------------------------------

/** Base URL path prefix for all API v1 endpoints */
export const API_V1_PREFIX = '/api/v1';

// ---------------------------------------------------------------------------
// Auth Endpoints
// ---------------------------------------------------------------------------

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_V1_PREFIX}/auth/register`,
  LOGIN: `${API_V1_PREFIX}/auth/login`,
  LOGOUT: `${API_V1_PREFIX}/auth/logout`,
  REFRESH_TOKEN: `${API_V1_PREFIX}/auth/refresh`,
  FORGOT_PASSWORD: `${API_V1_PREFIX}/auth/forgot-password`,
  RESET_PASSWORD: `${API_V1_PREFIX}/auth/reset-password`,
  VERIFY_EMAIL: `${API_V1_PREFIX}/auth/verify-email`,
  VERIFY_PHONE: `${API_V1_PREFIX}/auth/verify-phone`,
  ME: `${API_V1_PREFIX}/auth/me`,
  CHANGE_PASSWORD: `${API_V1_PREFIX}/auth/change-password`,
} as const;

// ---------------------------------------------------------------------------
// User Endpoints
// ---------------------------------------------------------------------------

export const USER_ENDPOINTS = {
  PROFILE: `${API_V1_PREFIX}/users/profile`,
  UPDATE_PROFILE: `${API_V1_PREFIX}/users/profile`,
  UPLOAD_AVATAR: `${API_V1_PREFIX}/users/profile/avatar`,
  LIST: `${API_V1_PREFIX}/users`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/users/${id}`,
  UPDATE_ROLE: (id: string) => `${API_V1_PREFIX}/users/${id}/role`,
} as const;

// ---------------------------------------------------------------------------
// Provider Endpoints
// ---------------------------------------------------------------------------

export const PROVIDER_ENDPOINTS = {
  REGISTER: `${API_V1_PREFIX}/providers/register`,
  LIST: `${API_V1_PREFIX}/providers`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/providers/${id}`,
  UPDATE: (id: string) => `${API_V1_PREFIX}/providers/${id}`,
  APPROVE: (id: string) => `${API_V1_PREFIX}/providers/${id}/approve`,
  SUSPEND: (id: string) => `${API_V1_PREFIX}/providers/${id}/suspend`,
  DASHBOARD: `${API_V1_PREFIX}/providers/dashboard`,
  ANALYTICS: `${API_V1_PREFIX}/providers/analytics`,
  BANK_ACCOUNT: `${API_V1_PREFIX}/providers/bank-account`,
} as const;

// ---------------------------------------------------------------------------
// Boat Endpoints
// ---------------------------------------------------------------------------

export const BOAT_ENDPOINTS = {
  LIST: `${API_V1_PREFIX}/boats`,
  CREATE: `${API_V1_PREFIX}/boats`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/boats/${id}`,
  UPDATE: (id: string) => `${API_V1_PREFIX}/boats/${id}`,
  DELETE: (id: string) => `${API_V1_PREFIX}/boats/${id}`,
  UPLOAD_IMAGE: (id: string) => `${API_V1_PREFIX}/boats/${id}/image`,
  CREW: {
    LIST: (boatId: string) => `${API_V1_PREFIX}/boats/${boatId}/crew`,
    ADD: (boatId: string) => `${API_V1_PREFIX}/boats/${boatId}/crew`,
    UPDATE: (boatId: string, crewId: string) =>
      `${API_V1_PREFIX}/boats/${boatId}/crew/${crewId}`,
    REMOVE: (boatId: string, crewId: string) =>
      `${API_V1_PREFIX}/boats/${boatId}/crew/${crewId}`,
  },
  LOCATION: (id: string) => `${API_V1_PREFIX}/boats/${id}/location`,
} as const;

// ---------------------------------------------------------------------------
// Tour / Product Endpoints
// ---------------------------------------------------------------------------

export const TOUR_ENDPOINTS = {
  LIST: `${API_V1_PREFIX}/tours`,
  SEARCH: `${API_V1_PREFIX}/tours/search`,
  FEATURED: `${API_V1_PREFIX}/tours/featured`,
  CREATE: `${API_V1_PREFIX}/tours`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/tours/${id}`,
  UPDATE: (id: string) => `${API_V1_PREFIX}/tours/${id}`,
  DELETE: (id: string) => `${API_V1_PREFIX}/tours/${id}`,
  TOGGLE_ACTIVE: (id: string) => `${API_V1_PREFIX}/tours/${id}/toggle-active`,
  IMAGES: {
    LIST: (tourId: string) => `${API_V1_PREFIX}/tours/${tourId}/images`,
    UPLOAD: (tourId: string) => `${API_V1_PREFIX}/tours/${tourId}/images`,
    DELETE: (tourId: string, imageId: string) =>
      `${API_V1_PREFIX}/tours/${tourId}/images/${imageId}`,
    REORDER: (tourId: string) =>
      `${API_V1_PREFIX}/tours/${tourId}/images/reorder`,
  },
  SCHEDULES: {
    LIST: (tourId: string) => `${API_V1_PREFIX}/tours/${tourId}/schedules`,
    CREATE: (tourId: string) => `${API_V1_PREFIX}/tours/${tourId}/schedules`,
    UPDATE: (tourId: string, scheduleId: string) =>
      `${API_V1_PREFIX}/tours/${tourId}/schedules/${scheduleId}`,
    DELETE: (tourId: string, scheduleId: string) =>
      `${API_V1_PREFIX}/tours/${tourId}/schedules/${scheduleId}`,
  },
  AVAILABILITY: (id: string) => `${API_V1_PREFIX}/tours/${id}/availability`,
  BY_PROVINCE: (province: string) =>
    `${API_V1_PREFIX}/tours/province/${province}`,
} as const;

// ---------------------------------------------------------------------------
// Booking Endpoints
// ---------------------------------------------------------------------------

export const BOOKING_ENDPOINTS = {
  CREATE: `${API_V1_PREFIX}/bookings`,
  LIST: `${API_V1_PREFIX}/bookings`,
  MY_BOOKINGS: `${API_V1_PREFIX}/bookings/my`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/bookings/${id}`,
  GET_BY_REFERENCE: (ref: string) =>
    `${API_V1_PREFIX}/bookings/reference/${ref}`,
  CANCEL: (id: string) => `${API_V1_PREFIX}/bookings/${id}/cancel`,
  CONFIRM: (id: string) => `${API_V1_PREFIX}/bookings/${id}/confirm`,
  CHECKIN: (id: string) => `${API_V1_PREFIX}/bookings/${id}/checkin`,
  COMPLETE: (id: string) => `${API_V1_PREFIX}/bookings/${id}/complete`,
  PASSENGERS: {
    LIST: (bookingId: string) =>
      `${API_V1_PREFIX}/bookings/${bookingId}/passengers`,
    ADD: (bookingId: string) =>
      `${API_V1_PREFIX}/bookings/${bookingId}/passengers`,
    UPDATE: (bookingId: string, passengerId: string) =>
      `${API_V1_PREFIX}/bookings/${bookingId}/passengers/${passengerId}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Payment Endpoints
// ---------------------------------------------------------------------------

export const PAYMENT_ENDPOINTS = {
  CREATE: `${API_V1_PREFIX}/payments`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/payments/${id}`,
  GET_BY_BOOKING: (bookingId: string) =>
    `${API_V1_PREFIX}/payments/booking/${bookingId}`,
  CONFIRM: (id: string) => `${API_V1_PREFIX}/payments/${id}/confirm`,
  UPLOAD_SLIP: (id: string) => `${API_V1_PREFIX}/payments/${id}/slip`,
  REFUND: (id: string) => `${API_V1_PREFIX}/payments/${id}/refund`,
  WEBHOOK: `${API_V1_PREFIX}/payments/webhook`,
  TRANSACTIONS: (id: string) =>
    `${API_V1_PREFIX}/payments/${id}/transactions`,
} as const;

// ---------------------------------------------------------------------------
// Review Endpoints
// ---------------------------------------------------------------------------

export const REVIEW_ENDPOINTS = {
  CREATE: `${API_V1_PREFIX}/reviews`,
  LIST: `${API_V1_PREFIX}/reviews`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/reviews/${id}`,
  GET_BY_TOUR: (tourId: string) => `${API_V1_PREFIX}/reviews/tour/${tourId}`,
  RESPOND: (id: string) => `${API_V1_PREFIX}/reviews/${id}/respond`,
  APPROVE: (id: string) => `${API_V1_PREFIX}/reviews/${id}/approve`,
  REJECT: (id: string) => `${API_V1_PREFIX}/reviews/${id}/reject`,
  FLAG: (id: string) => `${API_V1_PREFIX}/reviews/${id}/flag`,
  IMAGES: {
    UPLOAD: (reviewId: string) =>
      `${API_V1_PREFIX}/reviews/${reviewId}/images`,
    DELETE: (reviewId: string, imageId: string) =>
      `${API_V1_PREFIX}/reviews/${reviewId}/images/${imageId}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Promotion Endpoints
// ---------------------------------------------------------------------------

export const PROMOTION_ENDPOINTS = {
  CREATE: `${API_V1_PREFIX}/promotions`,
  LIST: `${API_V1_PREFIX}/promotions`,
  GET_BY_ID: (id: string) => `${API_V1_PREFIX}/promotions/${id}`,
  UPDATE: (id: string) => `${API_V1_PREFIX}/promotions/${id}`,
  DELETE: (id: string) => `${API_V1_PREFIX}/promotions/${id}`,
  VALIDATE_CODE: `${API_V1_PREFIX}/promotions/validate`,
  APPLY: `${API_V1_PREFIX}/promotions/apply`,
} as const;

// ---------------------------------------------------------------------------
// Location Endpoints
// ---------------------------------------------------------------------------

export const LOCATION_ENDPOINTS = {
  PIERS: {
    LIST: `${API_V1_PREFIX}/locations/piers`,
    GET_BY_ID: (id: string) => `${API_V1_PREFIX}/locations/piers/${id}`,
    CREATE: `${API_V1_PREFIX}/locations/piers`,
    UPDATE: (id: string) => `${API_V1_PREFIX}/locations/piers/${id}`,
  },
  PROVINCES: {
    LIST: `${API_V1_PREFIX}/locations/provinces`,
    GET_BY_ID: (id: string) => `${API_V1_PREFIX}/locations/provinces/${id}`,
  },
  SERVICE_AREAS: {
    LIST: `${API_V1_PREFIX}/locations/service-areas`,
    CREATE: `${API_V1_PREFIX}/locations/service-areas`,
    DELETE: (id: string) => `${API_V1_PREFIX}/locations/service-areas/${id}`,
  },
} as const;

// ---------------------------------------------------------------------------
// Notification Endpoints
// ---------------------------------------------------------------------------

export const NOTIFICATION_ENDPOINTS = {
  LIST: `${API_V1_PREFIX}/notifications`,
  MARK_READ: (id: string) => `${API_V1_PREFIX}/notifications/${id}/read`,
  MARK_ALL_READ: `${API_V1_PREFIX}/notifications/read-all`,
  UNREAD_COUNT: `${API_V1_PREFIX}/notifications/unread-count`,
} as const;

// ---------------------------------------------------------------------------
// Admin Endpoints
// ---------------------------------------------------------------------------

export const ADMIN_ENDPOINTS = {
  DASHBOARD: `${API_V1_PREFIX}/admin/dashboard`,
  ANALYTICS: `${API_V1_PREFIX}/admin/analytics`,
  REPORTS: {
    REVENUE: `${API_V1_PREFIX}/admin/reports/revenue`,
    BOOKINGS: `${API_V1_PREFIX}/admin/reports/bookings`,
    USERS: `${API_V1_PREFIX}/admin/reports/users`,
    PROVIDERS: `${API_V1_PREFIX}/admin/reports/providers`,
  },
} as const;

// ---------------------------------------------------------------------------
// Upload Endpoints
// ---------------------------------------------------------------------------

export const UPLOAD_ENDPOINTS = {
  IMAGE: `${API_V1_PREFIX}/uploads/image`,
  DOCUMENT: `${API_V1_PREFIX}/uploads/document`,
} as const;

// ---------------------------------------------------------------------------
// Enum Value Arrays (for dropdowns, validation, etc.)
// ---------------------------------------------------------------------------

export const BOOKING_STATUSES = Object.values(BookingStatus);
export const PAYMENT_STATUSES = Object.values(PaymentStatus);
export const PAYMENT_METHODS = Object.values(PaymentMethod);
export const REVIEW_STATUSES = Object.values(ReviewStatus);
export const PROVIDER_STATUSES = Object.values(ProviderStatus);
export const BOAT_STATUSES = Object.values(BoatStatus);
export const BOAT_TYPES = Object.values(BoatType);
export const USER_ROLES = Object.values(UserRole);
export const PASSENGER_TYPES = Object.values(PassengerType);
export const NOTIFICATION_TYPES = Object.values(NotificationType);
export const DISCOUNT_TYPES = Object.values(DiscountType);

// ---------------------------------------------------------------------------
// Display Labels (Thai)
// ---------------------------------------------------------------------------

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'รอดำเนินการ',
  [BookingStatus.CONFIRMED]: 'ยืนยันแล้ว',
  [BookingStatus.CHECKED_IN]: 'เช็คอินแล้ว',
  [BookingStatus.COMPLETED]: 'เสร็จสิ้น',
  [BookingStatus.CANCELLED]: 'ยกเลิก',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'รอชำระ',
  [PaymentStatus.PAID]: 'ชำระแล้ว',
  [PaymentStatus.FAILED]: 'ล้มเหลว',
  [PaymentStatus.REFUNDED]: 'คืนเงินแล้ว',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.QR]: 'QR Code / พร้อมเพย์',
  [PaymentMethod.CARD]: 'บัตรเครดิต/เดบิต',
  [PaymentMethod.COD]: 'ชำระที่ท่าเรือ',
};

export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.SPEEDBOAT]: 'สปีดโบ๊ท',
  [BoatType.LONGTAIL]: 'เรือหางยาว',
  [BoatType.CATAMARAN]: 'เรือคาตามารัน',
  [BoatType.YACHT]: 'เรือยอร์ช',
  [BoatType.FERRY]: 'เรือเฟอร์รี่',
};

export const BOAT_STATUS_LABELS: Record<BoatStatus, string> = {
  [BoatStatus.AVAILABLE]: 'พร้อมใช้งาน',
  [BoatStatus.MAINTENANCE]: 'ซ่อมบำรุง',
  [BoatStatus.RETIRED]: 'ปลดระวาง',
};

export const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  [ProviderStatus.PENDING]: 'รอตรวจสอบ',
  [ProviderStatus.APPROVED]: 'อนุมัติแล้ว',
  [ProviderStatus.SUSPENDED]: 'ระงับ',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  [ReviewStatus.PENDING]: 'รอตรวจสอบ',
  [ReviewStatus.APPROVED]: 'อนุมัติ',
  [ReviewStatus.REJECTED]: 'ปฏิเสธ',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'ลูกค้า',
  [UserRole.PROVIDER]: 'ผู้ให้บริการ',
  [UserRole.ADMIN]: 'ผู้ดูแลระบบ',
};

export const PASSENGER_TYPE_LABELS: Record<PassengerType, string> = {
  [PassengerType.ADULT]: 'ผู้ใหญ่',
  [PassengerType.CHILD]: 'เด็ก',
  [PassengerType.INFANT]: 'ทารก',
};

// ---------------------------------------------------------------------------
// App Constants
// ---------------------------------------------------------------------------

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size */
export const MAX_PAGE_SIZE = 100;

/** Maximum file upload size in bytes (10 MB) */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/** Accepted image MIME types */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Maximum number of images per tour */
export const MAX_TOUR_IMAGES = 20;

/** Maximum number of images per review */
export const MAX_REVIEW_IMAGES = 5;

/** Minimum advance booking time in hours */
export const MIN_BOOKING_ADVANCE_HOURS = 24;

/** Maximum advance booking time in days */
export const MAX_BOOKING_ADVANCE_DAYS = 365;
