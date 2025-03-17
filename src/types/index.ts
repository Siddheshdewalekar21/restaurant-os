// User types
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'CHEF' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Branch types
export interface Branch {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Menu types
export interface Category {
  id: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

// Table types
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  branchId: string;
  positionX: number;
  positionY: number;
  shape: 'CIRCLE' | 'RECTANGLE' | 'SQUARE';
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

// Order types
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  totalAmount: number;
  tax: number;
  discount?: number;
  tableId?: string;
  userId?: string;
  branchId?: string;
  customerId?: string;
  items?: OrderItem[];
  table?: Table;
  user?: User;
  customer?: Customer;
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  orderId: string;
  order?: Order;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory types
export interface Inventory {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  costPerUnit: number;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryUsage {
  id: string;
  quantity: number;
  menuItemId: string;
  inventoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  rating: number;
  comment?: string;
  customerId: string;
  createdAt: Date;
}

// Reservation types
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  name: string;
  email?: string;
  phone: string;
  guestCount: number;
  date: Date;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
} 