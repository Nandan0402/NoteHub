import axios from 'axios';
import { auth } from '../firebase/config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            console.error('Authentication error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

// Profile API endpoints
export const profileAPI = {
    // Get current user profile
    getProfile: async () => {
        const response = await api.get('/api/profile');
        return response.data;
    },

    // Create new profile
    createProfile: async (profileData) => {
        const response = await api.post('/api/profile', profileData);
        return response.data;
    },

    // Update existing profile
    updateProfile: async (profileData) => {
        const response = await api.put('/api/profile', profileData);
        return response.data;
    },

    // Delete profile
    deleteProfile: async () => {
        const response = await api.delete('/api/profile');
        return response.data;
    }
};

// Health check
export const healthCheck = async () => {
    const response = await api.get('/api/health');
    return response.data;
};

export default api;
