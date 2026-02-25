export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export enum InventoryUnit {
  GRAM = 'GRAM',
  ML = 'ML',
  UNIT = 'UNIT',
}

export enum OrderSource {
  POS = 'POS',
  WHATSAPP = 'WHATSAPP',
  ONLINE = 'ONLINE',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  LOCAL = 'LOCAL',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  WEBPAY = 'WEBPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
}

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PaymentProvider {
  WEBPAY = 'WEBPAY',
  STRIPE = 'STRIPE',
  MERCADOPAGO = 'MERCADOPAGO',
  OTHER = 'OTHER',
}

export enum PaymentEnvironment {
  TEST = 'TEST',
  PRODUCTION = 'PRODUCTION',
}
