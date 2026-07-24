import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT dans chaque requête
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rafraîchir le token si expiré
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          Cookies.set('access_token', data.access, { expires: 1 });
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ======================================
// Auth
// ======================================
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { username: email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
  getLivreurs: () => api.get('/auth/livreurs/available/'),
  adminUsers: () => api.get('/auth/admin/users/'),
  adminUserStats: () => api.get('/auth/admin/users/stats/'),
  toggleVerify: (id: number) => api.post(`/auth/admin/users/${id}/toggle_verify/`),
  toggleActive: (id: number) => api.post(`/auth/admin/users/${id}/toggle_active/`),

  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/request/', { email }),
  confirmPasswordReset: (data: { email: string; otp_code: string; new_password: string; new_password2: string }) =>
    api.post('/auth/password-reset/confirm/', data),

  requestEmailChange: (data: { current_email: string; new_email: string }) =>
    api.post('/auth/me/email-change/request/', data),
  confirmEmailChange: (otp_code: string) =>
    api.post('/auth/me/email-change/confirm/', { otp_code }),
};

// ======================================
// Adresses sauvegardées
// ======================================
export const addressApi = {
  list: () => api.get('/auth/addresses/'),
  create: (data: Record<string, unknown>) => api.post('/auth/addresses/', data),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/auth/addresses/${id}/`, data),
  remove: (id: number) => api.delete(`/auth/addresses/${id}/`),
};

// ======================================
// Codes promo
// ======================================
export const promoApi = {
  validate: (data: { code: string; order_type: string; subtotal: number }) =>
    api.post('/auth/promo-codes/validate/', data),
  adminList: () => api.get('/auth/admin/promo-codes/'),
  adminCreate: (data: Record<string, unknown>) => api.post('/auth/admin/promo-codes/', data),
  adminToggleActive: (id: number) => api.post(`/auth/admin/promo-codes/${id}/toggle_active/`),
  adminRedemptions: () => api.get('/auth/admin/promo-redemptions/'),
};

// ======================================
// Delivery
// ======================================
export const deliveryApi = {
  getRestaurants: (params?: Record<string, string>) =>
    api.get('/delivery/restaurants/', { params }),
  getRestaurant: (id: number) => api.get(`/delivery/restaurants/${id}/`),
  getRestaurantMenu: (id: number) => api.get(`/delivery/restaurants/${id}/menu/`),
  createRestaurant: (data: Record<string, unknown>) =>
    api.post('/delivery/restaurants/', data),
  updateRestaurant: (id: number, data: Record<string, unknown>) =>
    api.patch(`/delivery/restaurants/${id}/`, data),
  toggleOpen: (id: number) => api.post(`/delivery/restaurants/${id}/toggle_open/`),

  getMenuItems: (restaurantId: number) =>
    api.get(`/delivery/restaurants/${restaurantId}/menu-items/`),
  createMenuItem: (restaurantId: number, data: Record<string, unknown>) =>
    api.post(`/delivery/restaurants/${restaurantId}/menu-items/`, data),
  updateMenuItem: (restaurantId: number, id: number, data: Record<string, unknown>) =>
    api.patch(`/delivery/restaurants/${restaurantId}/menu-items/${id}/`, data),
  deleteMenuItem: (restaurantId: number, id: number) =>
    api.delete(`/delivery/restaurants/${restaurantId}/menu-items/${id}/`),

  getCategories: () => api.get('/delivery/categories/'),

  getOrders: (params?: Record<string, string>) =>
    api.get('/delivery/orders/', { params }),
  createOrder: (data: Record<string, unknown>) => api.post('/delivery/orders/', data),
  updateOrderStatus: (id: number, status: string) =>
    api.post(`/delivery/orders/${id}/update_status/`, { status }),
  assignLivreur: (orderId: number, livreurId?: number) =>
    api.post(`/delivery/orders/${orderId}/assign_livreur/`, livreurId ? { livreur_id: livreurId } : {}),
  getAvailableOrders: () => api.get('/delivery/orders/available/'),
  cancelDelivery: (orderId: number) => api.post(`/delivery/orders/${orderId}/cancel_delivery/`),
  adminAllOrders: () => api.get('/delivery/orders/admin_all/'),
  getAdminStats: () => api.get('/delivery/admin/stats/'),

  initiatePayment: (orderId: number, data: { phone_number: string }) =>
    api.post(`/delivery/orders/${orderId}/payment/initiate/`, data),
  confirmPayment: (orderId: number, data: { reference: string; otp_code: string }) =>
    api.post(`/delivery/orders/${orderId}/payment/confirm/`, data),
};

// ======================================
// Market
// ======================================
export const marketApi = {
  getRequests: (params?: Record<string, string>) =>
    api.get('/market/requests/', { params }),
  getRequest: (id: number) => api.get(`/market/requests/${id}/`),
  createRequest: (data: Record<string, unknown>) => api.post('/market/requests/', data),
  makeOffer: (id: number, data: Record<string, unknown>) =>
    api.post(`/market/requests/${id}/make_offer/`, data),
  acceptOffer: (id: number, offerId: number) =>
    api.post(`/market/requests/${id}/accept_offer/`, { offer_id: offerId }),
  updateStatus: (id: number, status: string) =>
    api.post(`/market/requests/${id}/update_status/`, { status }),
  assignLivreur: (id: number, livreurId: number, deliveryFee?: number) =>
    api.post(`/market/requests/${id}/assign_livreur/`, {
      livreur_id: livreurId,
      delivery_fee: deliveryFee,
    }),
  updateItems: (id: number, items: unknown[]) =>
    api.post(`/market/requests/${id}/update_items/`, { items }),
  getOpenRequests: () => api.get('/market/requests/open_requests/'),
  getNeedDelivery: () => api.get('/market/requests/need_delivery/'),
  getAdminStats: () => api.get('/market/admin/stats/'),
};

// ======================================
// Marketplace
// ======================================
export const marketplaceApi = {
  getCategories: () => api.get('/marketplace/categories/'),
  getShops: (params?: Record<string, string>) =>
    api.get('/marketplace/shops/', { params }),
  getShop: (id: number) => api.get(`/marketplace/shops/${id}/`),
  getShopProducts: (id: number, params?: Record<string, string>) =>
    api.get(`/marketplace/shops/${id}/products/`, { params }),
  createShop: (data: Record<string, unknown>) => api.post('/marketplace/shops/', data),
  updateShop: (id: number, data: Record<string, unknown>) =>
    api.patch(`/marketplace/shops/${id}/`, data),

  getProducts: (params?: Record<string, string>) =>
    api.get('/marketplace/products/', { params }),
  getProduct: (id: number) => api.get(`/marketplace/products/${id}/`),
  getFeaturedProducts: () => api.get('/marketplace/products/featured/'),
  createProduct: (data: Record<string, unknown>) => api.post('/marketplace/products/', data),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    api.patch(`/marketplace/products/${id}/`, data),

  getOrders: (params?: Record<string, string>) =>
    api.get('/marketplace/orders/', { params }),
  createOrder: (data: Record<string, unknown>) => api.post('/marketplace/orders/', data),
  updateOrderStatus: (id: number, status: string) =>
    api.post(`/marketplace/orders/${id}/update_status/`, { status }),
  assignLivreur: (orderId: number, livreurId?: number) =>
    api.post(`/marketplace/orders/${orderId}/assign_livreur/`,
      livreurId ? { livreur_id: livreurId } : {}),
  getAvailableForDelivery: () => api.get('/marketplace/orders/available_for_delivery/'),
  cancelDelivery: (orderId: number) => api.post(`/marketplace/orders/${orderId}/cancel_delivery/`),
  getAdminStats: () => api.get('/marketplace/admin/stats/'),

  initiatePayment: (orderId: number, data: { phone_number: string }) =>
    api.post(`/marketplace/orders/${orderId}/payment/initiate/`, data),
  confirmPayment: (orderId: number, data: { reference: string; otp_code: string }) =>
    api.post(`/marketplace/orders/${orderId}/payment/confirm/`, data),
};

// ======================================
// Position live du livreur
// ======================================
export const livreurPositionApi = {
  push: (data: { latitude: number; longitude: number; order_type?: string; order_id?: number }) =>
    api.post('/auth/livreurs/position/', data),
  getForDeliveryOrder: (orderId: number) => api.get(`/delivery/orders/${orderId}/livreur-position/`),
  getForMarketRequest: (requestId: number) => api.get(`/market/requests/${requestId}/livreur-position/`),
  getForMarketplaceOrder: (orderId: number) => api.get(`/marketplace/orders/${orderId}/livreur-position/`),
};

// ======================================
// Notifications in-app
// ======================================
export const notificationApi = {
  list: () => api.get('/auth/notifications/'),
  unreadCount: () => api.get('/auth/notifications/unread_count/'),
  markRead: (id: number) => api.post(`/auth/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/auth/notifications/mark_all_read/'),
};

// ======================================
// Chat par commande
// ======================================
export const chatApi = {
  open: (orderType: string, orderId: number) =>
    api.post('/auth/conversations/open/', { order_type: orderType, order_id: orderId }),
  getMessages: (conversationId: number) => api.get(`/auth/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId: number, body: string) =>
    api.post(`/auth/conversations/${conversationId}/messages/`, { body }),
};
