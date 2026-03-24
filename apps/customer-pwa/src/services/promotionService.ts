import apiClient from './apiClient';

export type DiscountType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  image?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minBookingAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  applicableTours?: string[];
  applicableAreas?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PromoValidation {
  valid: boolean;
  promotion?: Promotion;
  discountAmount?: number;
  message: string;
}

const promotionService = {
  async getPromotions(): Promise<Promotion[]> {
    const { data } = await apiClient.get<{ data: Promotion[] }>('/promotions');
    return data.data;
  },

  async getActivePromotions(): Promise<Promotion[]> {
    const { data } = await apiClient.get<{ data: Promotion[] }>('/promotions/active');
    return data.data;
  },

  async getPromotion(id: string): Promise<Promotion> {
    const { data } = await apiClient.get<{ data: Promotion }>(`/promotions/${id}`);
    return data.data;
  },

  async validatePromoCode(
    code: string,
    bookingAmount?: number,
    tourId?: string
  ): Promise<PromoValidation> {
    const { data } = await apiClient.post<{ data: PromoValidation }>('/promotions/validate', {
      code,
      bookingAmount,
      tourId,
    });
    return data.data;
  },

  async getUserPromotions(): Promise<Promotion[]> {
    const { data } = await apiClient.get<{ data: Promotion[] }>('/promotions/user');
    return data.data;
  },
};

export default promotionService;
