import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client.js';

const AuthContext = createContext(null);

function extractErrorMessage(err) {
  return err?.response?.data?.message || err.message || 'Something went wrong.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = useCallback(async ({ name, email, password }) => {
    try {
      const res = await apiClient.post('/api/auth/register', { name, email, password });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err) };
    }
  }, []);

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await apiClient.post('/api/auth/login', { email, password });
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
