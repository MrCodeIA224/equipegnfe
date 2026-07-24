// ======================================
// Types GnExpress
// ======================================

export type Role = 'ADMIN' | 'CLIENT' | 'LIVREUR' | 'RESTAURANT' | 'BOUTIQUIERR' | 'COURSIER';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: Role;
  phone: string;
  city: string;
  address?: string;
  bio?: string;
  profile_picture?: string;
  is_verified: boolean;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

// Adresses sauvegardées
export interface Address {
  id: number;
  label: string;
  full_address: string;
  city: string;
  is_default: boolean;
  created_at: string;
}

// Paiement Mobile Money (simulé)
export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOMO' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Payment {
  method: PaymentMethod;
  method_display: string;
  status: PaymentStatus;
  status_display: string;
  phone_number: string;
  transaction_reference: string;
  confirmed_at?: string;
}

// Codes promo
export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_amount: number;
  usage_limit?: number;
  times_used: number;
  expiry_date?: string;
  applicable_order_types: string[];
  is_active: boolean;
  created_at: string;
}

// Delivery
export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  image?: string;
  banner?: string;
  is_open: boolean;
  delivery_time: string;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order: number;
  delivery_fee: number;
  rating: string;
  total_orders: number;
  menu_items?: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  is_available: boolean;
  is_popular: boolean;
  category?: number;
  category_name?: string;
}

export interface FoodCategory {
  id: number;
  name: string;
  icon: string;
}

export type DeliveryOrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY'
  | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED' | 'LIVREUR_CANCELLED';

export interface DeliveryOrder {
  id: number;
  client_id: number;
  client_name: string;
  livreur_id?: number;
  livreur_name?: string;
  restaurant: number;
  restaurant_name: string;
  restaurant_image?: string;
  status: DeliveryOrderStatus;
  status_display: string;
  delivery_address: string;
  delivery_city: string;
  notes: string;
  items_total: number;
  delivery_fee: number;
  promo_code_used?: string;
  discount_amount?: number;
  total_price: number;
  created_at: string;
  order_items: DeliveryOrderItem[];
  payment?: Payment;
}

export interface DeliveryOrderItem {
  id: number;
  menu_item: number;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

// Market
export type MarketStatus =
  | 'OPEN' | 'ASSIGNED' | 'SHOPPING' | 'NEED_DELIVERY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface MarketRequest {
  id: number;
  client_id: number;
  client_name: string;
  coursier_id?: number;
  coursier_name?: string;
  livreur_id?: number;
  livreur_name?: string;
  status: MarketStatus;
  status_display: string;
  title: string;
  market_name: string;
  delivery_address: string;
  delivery_city: string;
  budget: number;
  notes: string;
  is_delivery_needed: boolean;
  service_fee: number;
  delivery_fee: number;
  promo_code_used?: string;
  discount_amount?: number;
  actual_total: number;
  created_at: string;
  completed_at?: string;
  items: MarketItem[];
  offers: CoursierOffer[];
  total_items: number;
}

export interface MarketItem {
  id?: number;
  name: string;
  quantity: string;
  estimated_price?: number;
  actual_price?: number;
  is_found: boolean;
  notes?: string;
}

export interface CoursierOffer {
  id: number;
  coursier_id: number;
  coursier_name: string;
  message: string;
  proposed_fee: number;
  is_accepted: boolean;
  created_at: string;
}

// Marketplace
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  products_count: number;
  shops_count: number;
}

export interface Shop {
  id: number;
  name: string;
  description: string;
  category?: number;
  category_name?: string;
  address: string;
  city: string;
  phone: string;
  whatsapp?: string;
  image?: string;
  banner?: string;
  is_active: boolean;
  has_delivery: boolean;
  delivery_fee: number;
  rating: string;
  total_sales: number;
  owner_id: number;
  owner_name?: string;
  products?: Product[];
  products_count: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  condition: string;
  condition_display: string;
  image?: string;
  image2?: string;
  image3?: string;
  is_available: boolean;
  is_featured: boolean;
  has_delivery: boolean;
  views_count: number;
  category?: number;
  category_name?: string;
  shop: number;
  shop_name?: string;
  created_at: string;
}

export type MarketplaceOrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY'
  | 'DELIVERING' | 'DELIVERED' | 'PICKUP_READY' | 'CANCELLED' | 'LIVREUR_CANCELLED';

export interface MarketplaceOrder {
  id: number;
  client_id: number;
  client_name: string;
  livreur_id?: number;
  livreur_name?: string;
  shop: number;
  shop_name: string;
  shop_image?: string;
  status: MarketplaceOrderStatus;
  status_display: string;
  delivery_type: 'DELIVERY' | 'PICKUP';
  delivery_address: string;
  delivery_city: string;
  notes: string;
  items_total: number;
  delivery_fee: number;
  promo_code_used?: string;
  discount_amount?: number;
  total_price: number;
  created_at: string;
  order_items: MarketplaceOrderItem[];
  payment?: Payment;
}

export interface MarketplaceOrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Cart
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  restaurantId?: number;
  shopId?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
