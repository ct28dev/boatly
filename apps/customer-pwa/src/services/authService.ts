import apiClient, { setAuthToken, clearAuthTokens } from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  acceptTerms: boolean;
}

export interface SocialLoginRequest {
  provider: 'google' | 'facebook' | 'line' | 'apple';
  accessToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  locale: string;
  isVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  locale?: string;
}

const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/login', credentials);
    setAuthToken(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/register', userData);
    setAuthToken(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async socialLogin(request: SocialLoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/social', request);
    setAuthToken(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuthTokens();
    }
  },

  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<{ data: UserProfile }>('/auth/profile');
    return data.data;
  },

  async updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    const { data } = await apiClient.patch<{ data: UserProfile }>('/auth/profile', updates);
    return data.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<{ data: AuthResponse }>('/auth/refresh', { refreshToken });
    setAuthToken(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },
};

export default authService;
