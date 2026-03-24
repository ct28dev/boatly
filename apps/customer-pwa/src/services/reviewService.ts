import apiClient from './apiClient';

export interface CreateReviewRequest {
  bookingId: string;
  tourId: string;
  rating: number;
  comment: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bookingId: string;
  tourId: string;
  tourName: string;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  response?: {
    text: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const reviewService = {
  async createReview(data: CreateReviewRequest): Promise<Review> {
    const { data: response } = await apiClient.post<{ data: Review }>('/reviews', data);
    return response.data;
  },

  async getTourReviews(
    tourId: string,
    page = 1,
    limit = 10,
    sortBy: 'newest' | 'highest' | 'lowest' = 'newest'
  ): Promise<{ reviews: Review[]; total: number; stats: ReviewStats }> {
    const { data } = await apiClient.get<{
      data: { reviews: Review[]; total: number; stats: ReviewStats };
    }>(`/tours/${tourId}/reviews`, {
      params: { page, limit, sortBy },
    });
    return data.data;
  },

  async uploadImages(reviewId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const { data } = await apiClient.post<{ data: { urls: string[] } }>(
      `/reviews/${reviewId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data.urls;
  },

  async getUserReviews(page = 1, limit = 10): Promise<{ reviews: Review[]; total: number }> {
    const { data } = await apiClient.get<{ data: { reviews: Review[]; total: number } }>(
      '/reviews/my',
      { params: { page, limit } }
    );
    return data.data;
  },

  async updateReview(reviewId: string, updates: { rating?: number; comment?: string }): Promise<Review> {
    const { data } = await apiClient.patch<{ data: Review }>(`/reviews/${reviewId}`, updates);
    return data.data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  async getReviewStats(tourId: string): Promise<ReviewStats> {
    const { data } = await apiClient.get<{ data: ReviewStats }>(`/tours/${tourId}/reviews/stats`);
    return data.data;
  },
};

export default reviewService;
