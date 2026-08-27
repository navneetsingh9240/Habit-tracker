import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('habit_tracker_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('habit_tracker_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('habit_tracker_token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('habit_tracker_token');
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, loading, login, logout, setUser };
}
