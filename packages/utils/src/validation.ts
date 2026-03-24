/**
 * Validates an email address format.
 *
 * @param email - The email string to validate
 * @returns `true` if the email format is valid
 *
 * @example
 * ```ts
 * validateEmail("user@example.com")  // true
 * validateEmail("invalid")           // false
 * validateEmail("")                  // false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email.trim());
}

/**
 * Validates a Thai phone number format.
 * Accepts formats: 0812345678, 08-1234-5678, +6681-234-5678, +66812345678
 *
 * @param phone - The phone number string to validate
 * @returns `true` if the phone number is a valid Thai format
 *
 * @example
 * ```ts
 * validatePhone("0812345678")      // true
 * validatePhone("08-1234-5678")    // true
 * validatePhone("+66812345678")    // true
 * validatePhone("+66-81-234-5678") // true
 * validatePhone("12345")           // false
 * ```
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[-\s]/g, '');
  // Thai mobile: 0[689]X-XXX-XXXX (10 digits) or +66[689]X-XXX-XXXX
  const thaiMobile = /^0[689]\d{8}$/;
  const thaiMobileIntl = /^\+66[689]\d{8}$/;
  // Thai landline: 0[2-7]X-XXX-XXXX (9 digits) or +66[2-7]X-XXX-XXXX
  const thaiLandline = /^0[2-7]\d{7}$/;
  const thaiLandlineIntl = /^\+66[2-7]\d{7}$/;

  return (
    thaiMobile.test(cleaned) ||
    thaiMobileIntl.test(cleaned) ||
    thaiLandline.test(cleaned) ||
    thaiLandlineIntl.test(cleaned)
  );
}

/**
 * Validates that a booking date is in the future and within an acceptable range.
 *
 * @param dateString - ISO 8601 date string of the desired booking date
 * @param options - Validation options
 * @returns Object with `valid` boolean and optional `reason` string
 *
 * @example
 * ```ts
 * validateBookingDate("2026-12-25")
 * // { valid: true }
 *
 * validateBookingDate("2020-01-01")
 * // { valid: false, reason: "Booking date must be in the future" }
 * ```
 */
export function validateBookingDate(
  dateString: string,
  options: {
    /** Minimum hours before departure to allow booking (default: 24) */
    minAdvanceHours?: number;
    /** Maximum days in advance a booking can be made (default: 365) */
    maxAdvanceDays?: number;
  } = {},
): { valid: boolean; reason?: string } {
  const { minAdvanceHours = 24, maxAdvanceDays = 365 } = options;

  const bookingDate = new Date(dateString);
  if (isNaN(bookingDate.getTime())) {
    return { valid: false, reason: 'Invalid date format' };
  }

  const now = new Date();
  const minDate = new Date(now.getTime() + minAdvanceHours * 60 * 60 * 1000);
  const maxDate = new Date(
    now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000,
  );

  if (bookingDate < minDate) {
    return {
      valid: false,
      reason: `Booking must be at least ${minAdvanceHours} hours in advance`,
    };
  }

  if (bookingDate > maxDate) {
    return {
      valid: false,
      reason: `Booking cannot be more than ${maxAdvanceDays} days in advance`,
    };
  }

  return { valid: true };
}
