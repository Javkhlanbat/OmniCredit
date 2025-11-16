/**
 * API Configuration and Helper Functions
 * OmniCredit - Frontend to Backend Integration
 */

// API Base URL Configuration
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname);

const API_CONFIG = {
    BASE_URL: isLocalHost
        ? 'http://localhost:5000/api'
        : 'https://omnicredit-backend.vercel.app/api', // Production backend URL
    TIMEOUT: 10000 // 10 seconds
};

// Token Management
const TokenManager = {
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    getToken() {
        return localStorage.getItem('authToken');
    },

    removeToken() {
        localStorage.removeItem('authToken');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// User Data Management
const UserManager = {
    setUser(user) {
        localStorage.setItem('userData', JSON.stringify(user));
    },

    getUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    removeUser() {
        localStorage.removeItem('userData');
    },

    logout() {
        TokenManager.removeToken();
        this.removeUser();
        window.location.href = '../pages/login.html';
    }
};

// API Client with error handling
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = TokenManager.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    UserManager.logout();
                    throw new Error('Нэвтрэх эрх дууссан байна. Дахин нэвтэрнэ үү.');
                }

                throw new Error(data.message || data.error || 'Алдаа гарлаа');
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Хүсэлт хугацаа хэтэрсэн байна');
            }

            if (!navigator.onLine) {
                throw new Error('Интернэт холболт алга байна');
            }

            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Initialize API Client
const api = new APIClient(API_CONFIG.BASE_URL);

// Authentication API
const AuthAPI = {
    async register(userData) {
        // Convert camelCase to snake_case for backend
        const backendData = {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            register_number: userData.registerId,
            id_front: userData.idFront,
            id_back: userData.idBack
        };
        const response = await api.post('/auth/register', backendData);
        if (response.token) {
            TokenManager.setToken(response.token);
            UserManager.setUser(response.user);
        }
        return response;
    },

    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.token) {
            TokenManager.setToken(response.token);
            UserManager.setUser(response.user);
        }
        return response;
    },

    async getProfile() {
        return await api.get('/auth/profile');
    },

    async verifyToken() {
        try {
            return await api.get('/auth/verify');
        } catch (error) {
            TokenManager.removeToken();
            UserManager.removeUser();
            return null;
        }
    },

    logout() {
        UserManager.logout();
    }
};

// Loans API
const LoansAPI = {
    async applyForLoan(loanData) {
        return await api.post('/loans/apply', loanData);
    },

    async getMyLoans() {
        return await api.get('/loans/my');
    },

    async getLoanById(loanId) {
        return await api.get(`/loans/${loanId}`);
    },

    async getMyLoanStats() {
        return await api.get('/loans/stats');
    },

    async applyForPurchaseLoan(purchaseData) {
        return await api.post('/loans/purchase', purchaseData);
    },

    async getMyPurchaseLoans() {
        return await api.get('/loans/purchase/my');
    },

    // Admin functions
    async getAllLoans() {
        return await api.get('/loans/admin/all');
    },

    async updateLoanStatus(loanId, status) {
        return await api.put(`/loans/admin/${loanId}/status`, { status });
    }
};

// Payments API
const PaymentsAPI = {
    async makePayment(paymentData) {
        return await api.post('/payments', paymentData);
    },

    async getMyPayments() {
        return await api.get('/payments/my');
    },

    async getLoanPayments(loanId) {
        return await api.get(`/payments/loan/${loanId}`);
    },

    async getPaymentById(paymentId) {
        return await api.get(`/payments/${paymentId}`);
    },

    async getMyPaymentStats() {
        return await api.get('/payments/stats');
    },

    async checkLoanBalance(loanId) {
        return await api.get(`/payments/loan/${loanId}/balance`);
    },

    // Admin functions
    async getAllPayments() {
        return await api.get('/payments/admin/all');
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.TokenManager = TokenManager;
    window.UserManager = UserManager;
    window.api = api;
    window.AuthAPI = AuthAPI;
    window.LoansAPI = LoansAPI;
    window.PaymentsAPI = PaymentsAPI;
}
