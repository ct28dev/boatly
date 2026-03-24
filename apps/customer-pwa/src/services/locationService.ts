import apiClient from './apiClient';

export interface Pier {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  area: string;
  province: string;
  facilities: string[];
  images: string[];
  parkingAvailable: boolean;
  isActive: boolean;
}

export interface ServiceArea {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  province: string;
  region: string;
  image: string;
  pierCount: number;
  tourCount: number;
  center: {
    lat: number;
    lng: number;
  };
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface BoatLocation {
  boatId: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: string;
  status: 'docked' | 'en_route' | 'at_destination' | 'returning';
}

const locationService = {
  async getPiers(area?: string): Promise<Pier[]> {
    const { data } = await apiClient.get<{ data: Pier[] }>('/piers', {
      params: area ? { area } : undefined,
    });
    return data.data;
  },

  async getPierById(pierId: string): Promise<Pier> {
    const { data } = await apiClient.get<{ data: Pier }>(`/piers/${pierId}`);
    return data.data;
  },

  async getNearbyPiers(lat: number, lng: number, radius = 30): Promise<Pier[]> {
    const { data } = await apiClient.get<{ data: Pier[] }>('/piers/nearby', {
      params: { lat, lng, radius },
    });
    return data.data;
  },

  async getServiceAreas(): Promise<ServiceArea[]> {
    const { data } = await apiClient.get<{ data: ServiceArea[] }>('/areas');
    return data.data;
  },

  async getServiceArea(areaId: string): Promise<ServiceArea> {
    const { data } = await apiClient.get<{ data: ServiceArea }>(`/areas/${areaId}`);
    return data.data;
  },

  async getBoatLocation(boatId: string): Promise<BoatLocation> {
    const { data } = await apiClient.get<{ data: BoatLocation }>(`/boats/${boatId}/location`);
    return data.data;
  },

  async trackBoat(bookingId: string): Promise<BoatLocation> {
    const { data } = await apiClient.get<{ data: BoatLocation }>(
      `/bookings/${bookingId}/boat-location`
    );
    return data.data;
  },

  async searchPiers(query: string): Promise<Pier[]> {
    const { data } = await apiClient.get<{ data: Pier[] }>('/piers/search', {
      params: { q: query },
    });
    return data.data;
  },
};

export default locationService;
