import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jwtToken'));
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    console.log('Current token state:', token);
  }, [token]);

  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-sign-in-button'),
        { theme: 'outline', size: 'large' }
      );
    } else {
      console.log('window.google is NOT available. Please ensure the GSI script is loaded.');
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    const id_token = response.credential;

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        id_token: id_token,
      });
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem('jwtToken', newToken);
      fetchProfile(newToken);
    } catch (error) {
      console.error('Google Auth Error:', error.response ? error.response.data : error);
      setMessage('Google Auth Failed');
    }
  };

  const fetchProfile = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setUser(response.data.user);
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Failed to fetch profile');
      setUser(null);
      setToken(null);
      localStorage.removeItem('jwtToken');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwtToken');
    setMessage('Logged out');
  };

  return { user, token, message, handleLogout, fetchProfile };
};

export default useAuth;
