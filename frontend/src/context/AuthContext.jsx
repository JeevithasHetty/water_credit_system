import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('aq_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  }, [token]);

  useEffect(() => {
    const restore = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await axios.get('/api/auth/me');
        if (data.success) setUser(data.user);
        else logout();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = (userData, jwt) => {
    localStorage.setItem('aq_token', jwt);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
    setToken(jwt);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('aq_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
