/**
 * API helpers — ต่อ backend BOATLY
 * baseURL จาก NEXT_PUBLIC_API_URL (เช่น http://localhost:4000/api/v1 หรือ /boatly/api)
 */
import apiClient from './apiClient';

export const api = apiClient;

/** รายการทริป / เรือ */
export const getTrips = (params?: Record<string, string | number | undefined>) =>
  apiClient.get('/tours', { params });

export const getTourById = (id: string | number) =>
  apiClient.get(`/tours/${id}`);

/** สร้างการจอง — path ตาม backend จริง */
export const bookBoat = (data: Record<string, unknown>) =>
  apiClient.post('/bookings', data);

export const getBookings = () => apiClient.get('/bookings');
