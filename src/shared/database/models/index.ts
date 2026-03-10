import { sequelize } from '../connection';
import { Business } from './Business';
import { Category } from './Category';
import { Customer } from './Customer';
import { CustomerAddress } from './CustomerAddress';
import { Event } from './Event';
import { InventoryItem } from './InventoryItem';
import { InventoryLocation } from './InventoryLocation';
import { InventoryMovement } from './InventoryMovement';
import { Location } from './Location';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';
import { Product } from './Product';
import { ProductOption } from './ProductOption';
import { ProductOptionRecipe } from './ProductOptionRecipe';
import { ProductRecipe } from './ProductRecipe';
import { Promotion } from './Promotion';
import { PromotionProduct } from './PromotionProduct';
import { ProductBusiness } from './ProductBusiness';
import { PromotionBusiness } from './PromotionBusiness';
import { EventProduct } from './EventProduct';
import { EventOrganizer } from './EventOrganizer';
import { EventExpense } from './EventExpense';
import { User } from './User';
import { Otp } from './Otp';
import { PaymentConfig } from './PaymentConfig';
import { Plan } from './Plan';
import { Subscription } from './Subscription';
import { SubscriptionPayment } from './SubscriptionPayment';
import { UserBusiness } from './UserBusiness';
import { BusinessOperatingContext } from './BusinessOperatingContext';
import { initializeAssociations } from './associations';

// Inicializar relaciones en un solo lugar
initializeAssociations();

export {
  Business,
  Category,
  Customer,
  CustomerAddress,
  Event,
  InventoryItem,
  InventoryLocation,
  InventoryMovement,
  Location,
  Order,
  OrderItem,
  Otp,
  Payment,
  PaymentConfig,
  Plan,
  Subscription,
  SubscriptionPayment,
  Product,
  ProductOption,
  ProductOptionRecipe,
  ProductRecipe,
  Promotion,
  PromotionProduct,
  PromotionBusiness,
  ProductBusiness,
  EventProduct,
  EventOrganizer,
  EventExpense,
  User,
  UserBusiness,
  BusinessOperatingContext,
  initializeAssociations,
};

export default sequelize;

