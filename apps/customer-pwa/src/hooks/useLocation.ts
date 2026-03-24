import { useState, useEffect, useCallback, useRef } from 'react';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
}

export interface LocationError {
  code: number;
  message: string;
}

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable' | 'unknown';

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const defaultOptions: UseLocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watch: false,
};

export function useLocation(options: UseLocationOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
  });
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<PermissionStatus>('unknown');

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
    });
    setError(null);
    setIsLoading(false);
    setPermission('granted');
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      1: 'Location permission denied',
      2: 'Position unavailable',
      3: 'Location request timed out',
    };

    setError({
      code: err.code,
      message: errorMessages[err.code] || 'Unknown location error',
    });
    setIsLoading(false);

    if (err.code === 1) {
      setPermission('denied');
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return 'unavailable';
    }

    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        const status = result.state as PermissionStatus;
        setPermission(status);

        result.addEventListener('change', () => {
          setPermission(result.state as PermissionStatus);
        });

        return status;
      }
    } catch {
      // Permissions API not supported
    }

    setPermission('prompt');
    return 'prompt';
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported' });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    });
  }, [handleSuccess, handleError, opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported' });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLoading(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    });
  }, [handleSuccess, handleError, opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    checkPermission();

    if (opts.watch) {
      watchPosition();
    }

    return () => {
      stopWatching();
    };
  }, [opts.watch, checkPermission, watchPosition, stopWatching]);

  return {
    location,
    error,
    isLoading,
    permission,
    isAvailable: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    getCurrentPosition,
    watchPosition,
    stopWatching,
    checkPermission,
  };
}
