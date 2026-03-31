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
  EVENT = 'EVENT',
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
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSFER = 'TRANSFER',
  WEBPAY = 'WEBPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  LOCAL_OPERATOR = 'LOCAL_OPERATOR',
}

export enum BusinessStatus {
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
}

export enum DiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PaymentProvider {
  WEBPAY = 'WEBPAY',
}

export enum PaymentEnvironment {
  TEST = 'TEST',
  PROD = 'PROD',
}
