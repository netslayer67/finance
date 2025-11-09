import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ApiContext = createContext();

export const useApi = () => {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};

const api = axios.create({
    baseURL: import.meta.env.PROD
        ? 'https://your-production-api.com/api'
        : '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    toast.error('Unauthorized access. Please login again.');
                    // Redirect to login page if needed
                    break;
                case 403:
                    toast.error('Access forbidden. You do not have permission.');
                    break;
                case 404:
                    toast.error('Resource not found.');
                    break;
                case 422:
                    toast.error(data.message || 'Validation error.');
                    break;
                case 429:
                    toast.error('Too many requests. Please try again later.');
                    break;
                case 500:
                    toast.error('Server error. Please try again later.');
                    break;
                default:
                    toast.error(data.message || 'An error occurred.');
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        } else {
            toast.error('An unexpected error occurred.');
        }

        return Promise.reject(error);
    }
);

export const ApiProvider = ({ children }) => {
    const value = {
        api,
        // Dashboard endpoints
        getDashboardOverview: (params) => api.get('/dashboard/overview', { params }),
        getDashboardCharts: (params) => api.get('/dashboard/charts', { params }),
        getDashboardStats: () => api.get('/dashboard/stats'),
        getSystemHealth: () => api.get('/dashboard/health'),

        // Financial records endpoints
        getFinancialRecords: (params) => api.get('/financial', { params }),
        getFinancialRecord: (id) => api.get(`/financial/${id}`),
        createFinancialRecord: (data) => api.post('/financial', data),
        updateFinancialRecord: (id, data) => api.put(`/financial/${id}`, data),
        deleteFinancialRecord: (id) => api.delete(`/financial/${id}`),
        getSummaryStatistics: (params) => api.get('/financial/summary/statistics', { params }),
        getMonthlyTrends: (params) => api.get('/financial/trends/monthly', { params }),

        // Upload endpoints
        uploadFile: (formData, onUploadProgress) =>
            api.post('/upload/excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress
            }),
        getUploadHistory: (params) => api.get('/upload/history', { params }),
        getUploadDetails: (id) => api.get(`/upload/${id}`),

        // Reports endpoints
        getConsolidatedReport: (params) => api.get('/reports/consolidated', { params }),
        getComparativeReport: (params) => api.get('/reports/comparative', { params }),
        getOrganizationSummary: (params) => api.get('/reports/organization-summary', { params }),
    };

    return (
        <ApiContext.Provider value={value}>
            {children}
        </ApiContext.Provider>
    );
};