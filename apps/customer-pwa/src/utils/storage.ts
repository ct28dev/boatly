function isClient(): boolean {
  return typeof window !== 'undefined';
}

export const storage = {
  getItem<T = string>(key: string): T | null {
    if (!isClient()) return null;
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch {
      try {
        return localStorage.getItem(key) as unknown as T;
      } catch {
        return null;
      }
    }
  },

  setItem<T>(key: string, value: T): void {
    if (!isClient()) return;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to set localStorage key "${key}":`, error);
    }
  },

  removeItem(key: string): void {
    if (!isClient()) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
    }
  },

  clear(): void {
    if (!isClient()) return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  has(key: string): boolean {
    if (!isClient()) return false;
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

export const sessionStore = {
  getItem<T = string>(key: string): T | null {
    if (!isClient()) return null;
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch {
      try {
        return sessionStorage.getItem(key) as unknown as T;
      } catch {
        return null;
      }
    }
  },

  setItem<T>(key: string, value: T): void {
    if (!isClient()) return;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to set sessionStorage key "${key}":`, error);
    }
  },

  removeItem(key: string): void {
    if (!isClient()) return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove sessionStorage key "${key}":`, error);
    }
  },
};
