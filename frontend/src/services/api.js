/**
 * RSA MVP Enhanced — API Service Layer
 * =====================================
 * Axios-based service for communicating with the FastAPI backend.
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout for large uploads
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        let message = 'An error occurred';
        const detail = error.response?.data?.detail;
        if (typeof detail === 'string') {
            message = detail;
        } else if (Array.isArray(detail)) {
            // FastAPI validation errors come as array of objects
            message = detail.map(d => d.msg || JSON.stringify(d)).join('; ');
        } else if (error.message) {
            message = error.message;
        }
        console.error(`[API Error] ${message}`);
        // Attach a safe string message
        error.safeMessage = message;
        return Promise.reject(error);
    }
);

// ============================================
// Resume APIs
// ============================================

export const resumeApi = {
    upload: (file, name, email) => {
        const formData = new FormData();
        formData.append('file', file);
        if (name) formData.append('name', name);
        if (email) formData.append('email', email);
        return api.post('/resumes/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    uploadBatch: (files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return api.post('/resumes/upload-batch', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    list: (page = 1, perPage = 20, status = null) => {
        const params = { page, per_page: perPage };
        if (status) params.status = status;
        return api.get('/resumes', { params });
    },

    get: (id) => api.get(`/resumes/${id}`),

    delete: (id) => api.delete(`/resumes/${id}`),
};

// ============================================
// Job Description APIs
// ============================================

export const jobApi = {
    upload: (file, title, company, department) => {
        const formData = new FormData();
        formData.append('file', file);
        const params = new URLSearchParams({ title });
        if (company) params.append('company', company);
        if (department) params.append('department', department);
        return api.post(`/jobs/upload?${params.toString()}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    create: (data) => api.post('/jobs/create', data),

    list: (page = 1, perPage = 20) => {
        return api.get('/jobs', { params: { page, per_page: perPage } });
    },

    get: (id) => api.get(`/jobs/${id}`),

    delete: (id) => api.delete(`/jobs/${id}`),
};

// ============================================
// Matching APIs
// ============================================

export const matchApi = {
    run: (jobId, candidateIds = null, config = null) => {
        const payload = { job_id: jobId };
        if (candidateIds) payload.candidate_ids = candidateIds;
        if (config) payload.config = config;
        return api.post('/match/run', payload);
    },

    getSessions: (page = 1) => {
        return api.get('/match/sessions', { params: { page } });
    },

    getResults: (sessionId, topN = null) => {
        const params = {};
        if (topN) params.top_n = topN;
        return api.get(`/match/results/${sessionId}`, { params });
    },

    getStatus: (sessionId) => api.get(`/match/status/${sessionId}`),
};

// ============================================
// Dashboard APIs  
// ============================================

export const dashboardApi = {
    getMetrics: (days = 30) => {
        return api.get('/dashboard/metrics', { params: { days } });
    },
};

// ============================================
// Report APIs
// ============================================

export const reportApi = {
    export: (sessionId, format = 'csv', topN = null) => {
        const payload = { session_id: sessionId, format };
        if (topN) payload.top_n = topN;
        return api.post('/reports/export', payload, {
            responseType: format === 'pdf' ? 'blob' : 'json',
        });
    },
};

// ============================================
// Webhook APIs
// ============================================

export const webhookApi = {
    notify: (eventType, payload) => {
        return api.post('/webhooks/ats/notify', null, {
            params: { event_type: eventType },
            data: payload,
        });
    },

    getLogs: (limit = 50) => {
        return api.get('/webhooks/ats/logs', { params: { limit } });
    },
};

export default api;
