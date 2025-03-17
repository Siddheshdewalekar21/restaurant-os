import { z } from 'zod';

// User validation schemas
export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'CHEF', 'CASHIER']).default('STAFF'),
  branchId: z.string().optional(),
});

// Menu validation schemas
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  image: z.string().optional(),
});

export const menuItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  image: z.string().optional(),
  isAvailable: z.boolean().default(true),
  categoryId: z.string(),
});

// Table validation schemas
export const tableSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be positive'),
  capacity: z.number().int().positive('Capacity must be positive'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING']).default('AVAILABLE'),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  branchId: z.string(),
  userId: z.string().optional(),
});

// Order validation schemas
export const orderItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  menuItemId: z.string().nonempty('Menu item ID is required'),
  notes: z.string().optional(),
});

// Fixed order schema with proper handling of tableId and customerId
export const orderSchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ONLINE']),
  // Use nullable() and optional() for tableId
  tableId: z.string().nullable().optional(),
  // Use nullable() and optional() for customerId
  customerId: z.string().nullable().optional(),
  items: z.array(orderItemSchema)
    .min(1, 'Order must have at least one item')
    .refine(
      (items) => {
        // Check for duplicate menu items
        const menuItemIds = items.map(item => item.menuItemId);
        return new Set(menuItemIds).size === menuItemIds.length;
      },
      {
        message: 'Duplicate menu items are not allowed',
        path: ['items']
      }
    ),
}).refine(
  (data) => {
    // If type is DINE_IN, tableId should be a non-empty string
    if (data.type === 'DINE_IN') {
      return typeof data.tableId === 'string' && data.tableId.length > 0;
    }
    // For other order types, tableId is optional
    return true;
  },
  {
    message: 'Table ID is required for dine-in orders',
    path: ['tableId']
  }
);

// Payment validation schemas
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'ONLINE']),
  transactionId: z.string().optional(),
  orderId: z.string(),
});

// Inventory validation schemas
export const inventorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string(),
  minLevel: z.number().positive('Minimum level must be positive'),
  costPerUnit: z.number().positive('Cost per unit must be positive'),
  branchId: z.string(),
});

// Customer validation schemas
export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Reservation validation schemas
export const reservationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string(),
  guestCount: z.number().int().positive('Guest count must be positive'),
  date: z.date(),
  specialRequests: z.string().optional(),
}); 