/**
 * Supported payment methods on the platform.
 */
export enum PaymentMethod {
  /** QR code payment (PromptPay / Thai QR) */
  QR = 'qr',
  /** Credit or debit card */
  CARD = 'card',
  /** Cash on departure (pay at pier) */
  COD = 'cod',
}

/**
 * Status of a payment transaction.
 */
export enum PaymentStatus {
  /** Payment initiated, awaiting confirmation */
  PENDING = 'pending',
  /** Payment successfully completed */
  PAID = 'paid',
  /** Payment attempt failed */
  FAILED = 'failed',
  /** Payment has been refunded */
  REFUNDED = 'refunded',
}

/**
 * Represents a payment record linked to a booking.
 */
export interface Payment {
  /** Unique identifier (UUID) */
  id: string;
  /** Booking this payment is for */
  booking_id: string;
  /** Total amount charged in Thai Baht */
  amount: number;
  /** Currency code (always THB for now) */
  currency: string;
  /** Method used for this payment */
  method: PaymentMethod;
  /** Current payment status */
  status: PaymentStatus;
  /** External payment gateway reference ID */
  gateway_reference: string | null;
  /** External transaction ID from the payment provider */
  gateway_transaction_id: string | null;
  /** URL to the payment slip image (for QR payments) */
  slip_image_url: string | null;
  /** ISO 8601 timestamp when payment was confirmed */
  paid_at: string | null;
  /** ISO 8601 timestamp when refund was processed */
  refunded_at: string | null;
  /** Reason for refund, if applicable */
  refund_reason: string | null;
  /** Amount refunded in Thai Baht, may be partial */
  refund_amount: number | null;
  /** ISO 8601 timestamp of payment record creation */
  created_at: string;
  /** ISO 8601 timestamp of last update */
  updated_at: string;
}

/**
 * Detailed transaction log entry for audit and reconciliation.
 */
export interface PaymentTransaction {
  /** Unique identifier (UUID) */
  id: string;
  /** Parent payment record */
  payment_id: string;
  /** Type of transaction event */
  transaction_type: 'charge' | 'refund' | 'void' | 'adjustment';
  /** Amount involved in this transaction in Thai Baht */
  amount: number;
  /** Status of this specific transaction */
  status: PaymentStatus;
  /** Reference from the payment gateway */
  gateway_reference: string | null;
  /** Raw response payload from the gateway (JSON string) */
  gateway_response: string | null;
  /** ISO 8601 timestamp of this transaction */
  created_at: string;
}
