import apiClient from './apiClient';

export interface TourFilters {
  search?: string;
  area?: string;
  pier?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  passengers?: number;
  boatType?: string;
  duration?: string;
  rating?: number;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'newest';
  page?: number;
  limit?: number;
}

export interface Tour {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  images: string[];
  thumbnail: string;
  price: number;
  originalPrice?: number;
  currency: string;
  duration: string;
  maxPassengers: number;
  boatType: string;
  boatName: string;
  departure: {
    pierId: string;
    pierName: string;
    lat: number;
    lng: number;
  };
  destinations: Array<{
    name: string;
    lat: number;
    lng: number;
    duration: string;
  }>;
  amenities: string[];
  schedule: TourSchedule[];
  rating: number;
  reviewCount: number;
  operatorId: string;
  operatorName: string;
  area: string;
  isActive: boolean;
  createdAt: string;
}

export interface TourSchedule {
  id: string;
  dayOfWeek?: number;
  date?: string;
  departureTime: string;
  returnTime: string;
  availableSeats: number;
}

export interface TourListResponse {
  tours: Tour[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TourReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  tourId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  response?: {
    text: string;
    createdAt: string;
  };
}

const tourService = {
  async getTours(filters: TourFilters = {}): Promise<TourListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });
    const { data } = await apiClient.get<{ data: TourListResponse }>(`/tours?${params}`);
    return data.data;
  },

  async getTourById(id: string): Promise<Tour> {
    const { data } = await apiClient.get<{ data: Tour }>(`/tours/${id}`);
    return data.data;
  },

  async getNearbyTours(lat: number, lng: number, radius = 50): Promise<Tour[]> {
    const { data } = await apiClient.get<{ data: Tour[] }>('/tours/nearby', {
      params: { lat, lng, radius },
    });
    return data.data;
  },

  async getRecommendedTours(): Promise<Tour[]> {
    const { data } = await apiClient.get<{ data: Tour[] }>('/tours/recommended');
    return data.data;
  },

  async getTourReviews(tourId: string, page = 1, limit = 10): Promise<{ reviews: TourReview[]; total: number }> {
    const { data } = await apiClient.get<{ data: { reviews: TourReview[]; total: number } }>(
      `/tours/${tourId}/reviews`,
      { params: { page, limit } }
    );
    return data.data;
  },

  async getPopularAreas(): Promise<Array<{ area: string; count: number; image: string }>> {
    const { data } = await apiClient.get<{ data: Array<{ area: string; count: number; image: string }> }>(
      '/tours/areas/popular'
    );
    return data.data;
  },

  async searchSuggestions(query: string): Promise<string[]> {
    const { data } = await apiClient.get<{ data: string[] }>('/tours/search/suggestions', {
      params: { q: query },
    });
    return data.data;
  },
};

export default tourService;
