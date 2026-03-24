import apiClient from './apiClient';

export type PaymentMethod = 'promptpay_qr' | 'credit_card' | 'bank_transfer' | 'cod';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  method: PaymentMethod;
}

export interface ProcessQRData {
  paymentId: string;
}

export interface ProcessCardData {
  paymentId: string;
  cardToken: string;
  saveCard?: boolean;
}

export interface ProcessCODData {
  paymentId: string;
  contactPhone: string;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

const paymentService = {
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const { data: response } = await apiClient.post<{ data: Payment }>('/payments', data);
    return response.data;
  },

  async getPayment(paymentId: string): Promise<Payment> {
    const { data } = await apiClient.get<{ data: Payment }>(`/payments/${paymentId}`);
    return data.data;
  },

  async getBookingPayment(bookingId: string): Promise<Payment> {
    const { data } = await apiClient.get<{ data: Payment }>(`/bookings/${bookingId}/payment`);
    return data.data;
  },

  async processQR(data: ProcessQRData): Promise<Payment> {
    const { data: response } = await apiClient.post<{ data: Payment }>(
      `/payments/${data.paymentId}/qr`,
      {}
    );
    return response.data;
  },

  async processCard(data: ProcessCardData): Promise<Payment> {
    const { data: response } = await apiClient.post<{ data: Payment }>(
      `/payments/${data.paymentId}/card`,
      { cardToken: data.cardToken, saveCard: data.saveCard }
    );
    return response.data;
  },

  async processCOD(data: ProcessCODData): Promise<Payment> {
    const { data: response } = await apiClient.post<{ data: Payment }>(
      `/payments/${data.paymentId}/cod`,
      { contactPhone: data.contactPhone }
    );
    return response.data;
  },

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const { data } = await apiClient.get<{ data: { status: PaymentStatus } }>(
      `/payments/${paymentId}/status`
    );
    return data.data.status;
  },

  async getSavedCards(): Promise<SavedCard[]> {
    const { data } = await apiClient.get<{ data: SavedCard[] }>('/payments/cards');
    return data.data;
  },

  async deleteSavedCard(cardId: string): Promise<void> {
    await apiClient.delete(`/payments/cards/${cardId}`);
  },

  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    const { data } = await apiClient.post<{ data: Payment }>(
      `/payments/${paymentId}/refund`,
      { reason }
    );
    return data.data;
  },
};

export default paymentService;
