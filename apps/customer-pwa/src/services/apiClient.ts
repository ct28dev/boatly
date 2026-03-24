import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { storage } from '@/utils/storage';

const TOKEN_KEY = 'boatly_token';
const REFRESH_TOKEN_KEY = 'boatly_refresh_token';
/** Legacy keys จากก่อน rename โฟลเดอร์ */
const LEGACY_TOKEN_KEY = 'boathub_token';
const LEGACY_REFRESH_KEY = 'boathub_refresh_token';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
}

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    let token = storage.getItem<string>(TOKEN_KEY);
    if (!token) token = storage.getItem<string>(LEGACY_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const locale = storage.getItem<string>('boatly_locale') || storage.getItem<string>('boathub_locale') || 'th';
    if (config.headers) {
      config.headers['Accept-Language'] = locale;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          storage.getItem<string>(REFRESH_TOKEN_KEY) || storage.getItem<string>(LEGACY_REFRESH_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const newToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        storage.setItem(TOKEN_KEY, newToken);
        storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        storage.removeItem(LEGACY_TOKEN_KEY);
        storage.removeItem(LEGACY_REFRESH_KEY);

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(REFRESH_TOKEN_KEY);
        storage.removeItem(LEGACY_TOKEN_KEY);
        storage.removeItem(LEGACY_REFRESH_KEY);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;

export function setAuthToken(token: string, refreshToken?: string) {
  storage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuthTokens() {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}
