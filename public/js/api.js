// API URL
const API_URL = window.location.origin + '/api';

// API helper fonksiyonu
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // FormData kullanılıyorsa Content-Type'ı kaldır
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Bir hata oluştu');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const AuthAPI = {
    register: async (userData) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    login: async (credentials) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    getProfile: async () => {
        return apiRequest('/auth/profile');
    }
};

// Challenge API
const ChallengeAPI = {
    getAll: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/challenges?${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/challenges/${id}`);
    },

    create: async (challengeData) => {
        return apiRequest('/challenges', {
            method: 'POST',
            body: JSON.stringify(challengeData)
        });
    },

    join: async (id) => {
        return apiRequest(`/challenges/${id}/join`, {
            method: 'POST'
        });
    },

    getCategories: async () => {
        return apiRequest('/challenges/categories');
    },

    getStats: async () => {
        return apiRequest('/challenges/stats');
    }
};

// Submission API
const SubmissionAPI = {
    getByChallenge: async (challengeId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/submissions/challenge/${challengeId}?${query}`);
    },

    create: async (challengeId, formData) => {
        return apiRequest(`/submissions/challenge/${challengeId}`, {
            method: 'POST',
            body: formData
        });
    },

    toggleLike: async (submissionId) => {
        return apiRequest(`/submissions/${submissionId}/like`, {
            method: 'POST'
        });
    },

    getComments: async (submissionId) => {
        return apiRequest(`/submissions/${submissionId}/comments`);
    },

    addComment: async (submissionId, content) => {
        return apiRequest(`/submissions/${submissionId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }
};
