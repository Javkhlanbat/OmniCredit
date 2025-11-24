
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname);

const API_CONFIG = {
    BASE_URL: isLocalHost
        ? 'http://localhost:5000/api'  // Локал хөгжүүлэлтийн сервер
        : 'https://omnicredit-backend.onrender.com/api', // Production сервер (Render)
    TIMEOUT: 30000 // 30 секунд (Render cold start-ийг харгалзан)
};

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
        window.location.href = 'login.html';
    }
};


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
                if (response.status === 401 || response.status === 403) {
                    TokenManager.removeToken();
                    UserManager.removeUser();
                    // Нэвтрэх хуудсанд шууд чиглүүлэхгүй, хэрэглэгчид мэдэгдэл харуулах
                    throw new Error('Нэвтрэх хугацаа дууссан байна. Дахин нэвтэрнэ үү.');
                }

                throw new Error(data.message || data.error || 'Алдаа гарлаа');
            }

            return data;

        } catch (error) {
            // Timeout алдаа
            if (error.name === 'AbortError') {
                throw new Error('Серверт холбогдох хугацаа хэтэрсэн байна. Дахин оролдоно уу.');
            }

            // Интернэт холболт алдаа
            if (!navigator.onLine) {
                throw new Error('Интернэт холболт алга байна');
            }

            // Render сервер унтарсан эсвэл асаагдаж байгаа тохиолдол
            if (error.message && error.message.includes('Failed to fetch')) {
                throw new Error('Серверт холбогдож чадсангүй. Render сервер асаагдах хүртэл хэдэн секунд хүлээнэ үү.');
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


const api = new APIClient(API_CONFIG.BASE_URL);


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
        const response = await api.get('/auth/profile');
        return response.user;
    },

    // Профайл зураг оруулах
    async uploadProfileImage(imageBase64) {
        return await api.post('/auth/profile/image', { profile_image: imageBase64 });
    },

    // Нэг хэрэглэгчийн дэлгэрэнгүй мэдээлэл (Admin - ID зургуудтай)
    async getAdminUserDetails(userId) {
        return await api.get(`/auth/admin/users/${userId}`);
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

    // Бүх зээлүүд авах (Admin)
    async getAllLoans() {
        return await api.get('/loans/admin/all');
    },

    // Зээлийн төлөв шинэчлэх (Admin)
    async updateLoanStatus(loanId, status) {
        return await api.put(`/loans/admin/${loanId}/status`, { status });
    },

    // Зээл олгох - approved зээлийг disbursed болгох (Admin)
    async disburseLoan(loanId) {
        return await api.post(`/loans/admin/${loanId}/disburse`);
    }
};

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

    // Бүх төлбөрүүд авах (Admin)
    async getAllPayments() {
        return await api.get('/payments/admin/all');
    }
};

// Wallet API
const WalletAPI = {
    // Wallet мэдээлэл авах
    async getMyWallet() {
        return await api.get('/wallet');
    },

    // Гүйлгээний түүх авах
    async getTransactions(limit = 20) {
        return await api.get('/wallet/transactions', { limit });
    },

    // Wallet руу мөнгө нэмэх (QPay)
    async depositToWallet(depositData) {
        return await api.post('/wallet/deposit', depositData);
    },

    // Банк руу шилжүүлэх (QPay)
    async withdrawToBank(withdrawData) {
        return await api.post('/wallet/withdraw', withdrawData);
    },

    // Wallet-ээс зээл төлөх
    async payLoanFromWallet(paymentData) {
        return await api.post('/wallet/pay-loan', paymentData);
    }
};

// Promo Code API (Нэмэгдлийн код)
const PromoCodeAPI = {
    // Код шалгах (хэрэглэгч)
    async verifyCode(code) {
        return await api.post('/promo/verify', { code });
    },

    // ==========================================
    // ADMIN - КОМПАНИ
    // ==========================================

    // Компани үүсгэх
    async createCompany(companyData) {
        return await api.post('/promo/admin/companies', companyData);
    },

    // Бүх компаниуд
    async getAllCompanies() {
        return await api.get('/promo/admin/companies');
    },

    // Компани дэлгэрэнгүй (нэмэгдлийн кодуудтай хамт)
    async getCompanyDetails(companyId) {
        return await api.get(`/promo/admin/companies/${companyId}`);
    },

    // Компани шинэчлэх
    async updateCompany(companyId, companyData) {
        return await api.put(`/promo/admin/companies/${companyId}`, companyData);
    },

    // Компани устгах
    async deleteCompany(companyId) {
        return await api.delete(`/promo/admin/companies/${companyId}`);
    },

    // ==========================================
    // ADMIN - НЭМЭГДЛИЙН КОД
    // ==========================================

    // Код үүсгэх
    async createPromoCode(promoData) {
        return await api.post('/promo/admin/codes', promoData);
    },

    // Бүх кодууд
    async getAllPromoCodes() {
        return await api.get('/promo/admin/codes');
    },

    // Код дэлгэрэнгүй
    async getPromoCodeDetails(codeId) {
        return await api.get(`/promo/admin/codes/${codeId}`);
    },

    // Код шинэчлэх
    async updatePromoCode(codeId, promoData) {
        return await api.put(`/promo/admin/codes/${codeId}`, promoData);
    },

    // Код устгах
    async deletePromoCode(codeId) {
        return await api.delete(`/promo/admin/codes/${codeId}`);
    }
};

if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.TokenManager = TokenManager;
    window.UserManager = UserManager;
    window.api = api;
    window.AuthAPI = AuthAPI;
    window.LoansAPI = LoansAPI;
    window.PaymentsAPI = PaymentsAPI;
    window.WalletAPI = WalletAPI;
    window.PromoCodeAPI = PromoCodeAPI;
}
