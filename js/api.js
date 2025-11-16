/**
 * API Тохиргоо ба Туслах Функцууд
 * OmniCredit - Frontend-Backend Холбох Хэсэг
 */

// ==============================================
// API Үндсэн URL Тохиргоо
// ==============================================
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname);

const API_CONFIG = {
    BASE_URL: isLocalHost
        ? 'http://localhost:5000/api'  // Локал хөгжүүлэлтийн сервер
        : 'https://omnicredit-backend.onrender.com/api', // Production сервер (Render)
    TIMEOUT: 10000 // 10 секунд (хүсэлтийн хугацаа)
};

// ==============================================
// Token (Нэвтрэх эрхийн түлхүүр) Удирдлага
// ==============================================
const TokenManager = {
    // Token хадгалах
    setToken(token) {
        localStorage.setItem('authToken', token);
    },

    // Token авах
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Token устгах
    removeToken() {
        localStorage.removeItem('authToken');
    },

    // Нэвтэрсэн эсэхийг шалгах
    isAuthenticated() {
        return !!this.getToken();
    }
};

// ==============================================
// Хэрэглэгчийн Мэдээлэл Удирдлага
// ==============================================
const UserManager = {
    // Хэрэглэгчийн мэдээлэл хадгалах
    setUser(user) {
        localStorage.setItem('userData', JSON.stringify(user));
    },

    // Хэрэглэгчийн мэдээлэл авах
    getUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },

    // Хэрэглэгчийн мэдээлэл устгах
    removeUser() {
        localStorage.removeItem('userData');
    },

    // Системээс гарах
    logout() {
        TokenManager.removeToken();
        this.removeUser();
        window.location.href = '../pages/login.html';
    }
};

// ==============================================
// API Client - Алдаа шийдвэрлэлттэй
// ==============================================
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    // Үндсэн хүсэлт илгээх функц
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = TokenManager.getToken();

        // Хүсэлтийн тохиргоо
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }), // Token нэмэх
                ...options.headers
            },
            ...options
        };

        try {
            // Timeout тохируулах
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Хариултын төрлийг тодорхойлох
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Алдаа шалгах
            if (!response.ok) {
                // 401 (Эрх дууссан) шалгах
                if (response.status === 401) {
                    UserManager.logout();
                    throw new Error('Нэвтрэх эрх дууссан байна. Дахин нэвтэрнэ үү.');
                }

                throw new Error(data.message || data.error || 'Алдаа гарлаа');
            }

            return data;

        } catch (error) {
            // Timeout алдаа
            if (error.name === 'AbortError') {
                throw new Error('Хүсэлт хугацаа хэтэрсэн байна');
            }

            // Интернэт холболт алдаа
            if (!navigator.onLine) {
                throw new Error('Интернэт холболт алга байна');
            }

            throw error;
        }
    }

    // GET хүсэлт (мэдээлэл авах)
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    }

    // POST хүсэлт (шинэ мэдээлэл үүсгэх)
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT хүсэлт (мэдээлэл шинэчлэх)
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE хүсэлт (мэдээлэл устгах)
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// ==============================================
// API Client эхлүүлэх
// ==============================================
const api = new APIClient(API_CONFIG.BASE_URL);

// ==============================================
// Нэвтрэх/Бүртгэлийн API
// ==============================================
const AuthAPI = {
    // Шинэ хэрэглэгч бүртгэх
    async register(userData) {
        // camelCase-ийг snake_case болгож backend руу илгээх
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

    // Нэвтрэх
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.token) {
            TokenManager.setToken(response.token);
            UserManager.setUser(response.user);
        }
        return response;
    },

    // Хувийн мэдээлэл авах
    async getProfile() {
        return await api.get('/auth/profile');
    },

    // Token баталгаажуулах
    async verifyToken() {
        try {
            return await api.get('/auth/verify');
        } catch (error) {
            TokenManager.removeToken();
            UserManager.removeUser();
            return null;
        }
    },

    // Системээс гарах
    logout() {
        UserManager.logout();
    }
};

// ==============================================
// Зээлийн API
// ==============================================
const LoansAPI = {
    // Зээлийн хүсэлт илгээх
    async applyForLoan(loanData) {
        return await api.post('/loans/apply', loanData);
    },

    // Миний зээлүүд авах
    async getMyLoans() {
        return await api.get('/loans/my');
    },

    // ID-аар зээл авах
    async getLoanById(loanId) {
        return await api.get(`/loans/${loanId}`);
    },

    // Миний зээлийн статистик авах
    async getMyLoanStats() {
        return await api.get('/loans/stats');
    },

    // Худалдан авалтын зээл хүсэх
    async applyForPurchaseLoan(purchaseData) {
        return await api.post('/loans/purchase', purchaseData);
    },

    // Миний худалдан авалтын зээлүүд
    async getMyPurchaseLoans() {
        return await api.get('/loans/purchase/my');
    },

    // ==============================================
    // Admin функцууд
    // ==============================================

    // Бүх зээлүүд авах (Admin)
    async getAllLoans() {
        return await api.get('/loans/admin/all');
    },

    // Зээлийн төлөв шинэчлэх (Admin)
    async updateLoanStatus(loanId, status) {
        return await api.put(`/loans/admin/${loanId}/status`, { status });
    }
};

// ==============================================
// Төлбөрийн API
// ==============================================
const PaymentsAPI = {
    // Төлбөр төлөх
    async makePayment(paymentData) {
        return await api.post('/payments', paymentData);
    },

    // Миний төлбөрүүд авах
    async getMyPayments() {
        return await api.get('/payments/my');
    },

    // Зээлийн төлбөрүүд авах
    async getLoanPayments(loanId) {
        return await api.get(`/payments/loan/${loanId}`);
    },

    // ID-аар төлбөр авах
    async getPaymentById(paymentId) {
        return await api.get(`/payments/${paymentId}`);
    },

    // Миний төлбөрийн статистик авах
    async getMyPaymentStats() {
        return await api.get('/payments/stats');
    },

    // Зээлийн үлдэгдэл шалгах
    async checkLoanBalance(loanId) {
        return await api.get(`/payments/loan/${loanId}/balance`);
    },

    // ==============================================
    // Admin функцууд
    // ==============================================

    // Бүх төлбөрүүд авах (Admin)
    async getAllPayments() {
        return await api.get('/payments/admin/all');
    }
};

// ==============================================
// Window объект руу экспорт хийх
// ==============================================
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.TokenManager = TokenManager;
    window.UserManager = UserManager;
    window.api = api;
    window.AuthAPI = AuthAPI;
    window.LoansAPI = LoansAPI;
    window.PaymentsAPI = PaymentsAPI;
}
