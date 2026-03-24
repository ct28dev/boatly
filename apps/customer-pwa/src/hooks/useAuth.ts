import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '@/store/userStore';
import authService, {
  type LoginRequest,
  type RegisterRequest,
  type SocialLoginRequest,
  type UpdateProfileRequest,
  type UserProfile,
} from '@/services/authService';

const PROFILE_QUERY_KEY = ['auth', 'profile'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    user,
    token,
    isAuthenticated,
    favorites,
    setUser,
    setToken,
    logout: clearStore,
    toggleFavorite,
    isFavorite,
  } = useUserStore();

  const profileQuery = useQuery<UserProfile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (profileQuery.data && (!user || user.id !== profileQuery.data.id)) {
    setUser(profileQuery.data);
  }

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.accessToken, data.refreshToken);
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.accessToken, data.refreshToken);
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.user);
    },
  });

  const socialLoginMutation = useMutation({
    mutationFn: (request: SocialLoginRequest) => authService.socialLogin(request),
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.accessToken, data.refreshToken);
      queryClient.setQueryData(PROFILE_QUERY_KEY, data.user);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates: UpdateProfileRequest) => authService.updateProfile(updates),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(PROFILE_QUERY_KEY, updatedUser);
    },
  });

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // logout from server failed, still clear local state
    } finally {
      clearStore();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      queryClient.clear();
    }
  }, [clearStore, queryClient]);

  return {
    user,
    isAuthenticated,
    isLoading: profileQuery.isLoading,
    favorites,

    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,

    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,

    socialLogin: socialLoginMutation.mutateAsync,
    isSocialLogging: socialLoginMutation.isPending,

    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,

    logout,
    toggleFavorite,
    isFavorite,
    refetchProfile: profileQuery.refetch,
  };
}
