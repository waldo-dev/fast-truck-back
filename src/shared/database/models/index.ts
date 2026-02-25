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
import { User } from './User';
import { Otp } from './Otp';
import { PaymentConfig } from './PaymentConfig';
import { UserBusiness } from './UserBusiness';

// Inicializar relaciones
const initializeRelations = (): void => {
  // Business relations
  Business.hasMany(Category, { foreignKey: 'business_id', as: 'categories' });
  Business.hasMany(Customer, { foreignKey: 'business_id', as: 'customers' });
  Business.hasMany(InventoryItem, { foreignKey: 'business_id', as: 'inventoryItems' });
  Business.hasMany(Location, { foreignKey: 'business_id', as: 'locations' });
  Business.hasMany(Product, { foreignKey: 'business_id', as: 'products' });
  Business.hasMany(Promotion, { foreignKey: 'business_id', as: 'promotions' });
  Business.hasMany(Order, { foreignKey: 'business_id', as: 'orders' });
  Business.hasMany(InventoryMovement, { foreignKey: 'business_id', as: 'inventoryMovements' });

  // Category relations
  Category.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

  // Customer relations
  Customer.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Customer.hasMany(CustomerAddress, { foreignKey: 'customer_id', as: 'addresses' });
  Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });

  // CustomerAddress relations
  CustomerAddress.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  CustomerAddress.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });

  // Event relations
  Event.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Event.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  Event.hasMany(InventoryLocation, { foreignKey: 'event_id', as: 'inventoryLocations' });
  Event.hasMany(InventoryMovement, { foreignKey: 'event_id', as: 'inventoryMovements' });
  Event.hasMany(Order, { foreignKey: 'event_id', as: 'orders' });

  // InventoryItem relations
  InventoryItem.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  InventoryItem.hasMany(InventoryLocation, { foreignKey: 'inventory_item_id', as: 'locations' });
  InventoryItem.hasMany(InventoryMovement, { foreignKey: 'inventory_item_id', as: 'movements' });
  InventoryItem.hasMany(ProductRecipe, { foreignKey: 'inventory_item_id', as: 'productRecipes' });
  InventoryItem.hasMany(ProductOptionRecipe, { foreignKey: 'inventory_item_id', as: 'productOptionRecipes' });

  // InventoryLocation relations
  InventoryLocation.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'inventoryItem' });
  InventoryLocation.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
  InventoryLocation.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

  // InventoryMovement relations
  InventoryMovement.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'inventoryItem' });
  InventoryMovement.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  InventoryMovement.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  InventoryMovement.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

  // Location relations
  Location.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Location.hasMany(Event, { foreignKey: 'location_id', as: 'events' });
  Location.hasMany(InventoryLocation, { foreignKey: 'location_id', as: 'inventoryLocations' });

  // Order relations
  Order.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  Order.belongsTo(CustomerAddress, { foreignKey: 'address_id', as: 'address' });
  Order.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
  Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
  Order.hasMany(InventoryMovement, { foreignKey: 'order_id', as: 'inventoryMovements' });

  // OrderItem relations
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Payment relations
  Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  // Product relations
  Product.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options' });
  Product.hasMany(ProductRecipe, { foreignKey: 'product_id', as: 'recipes' });
  Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
  Product.belongsToMany(Promotion, { through: PromotionProduct, foreignKey: 'product_id', as: 'promotions' });

  // ProductOption relations
  ProductOption.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  ProductOption.hasMany(ProductOptionRecipe, { foreignKey: 'product_option_id', as: 'recipes' });

  // ProductOptionRecipe relations
  ProductOptionRecipe.belongsTo(ProductOption, { foreignKey: 'product_option_id', as: 'productOption' });
  ProductOptionRecipe.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'inventoryItem' });

  // ProductRecipe relations
  ProductRecipe.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  ProductRecipe.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id', as: 'inventoryItem' });

  // Promotion relations
  Promotion.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Promotion.belongsToMany(Product, { through: PromotionProduct, foreignKey: 'promotion_id', as: 'products' });

  // PromotionProduct relations (tabla de unión)
  PromotionProduct.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
  PromotionProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // User relations
  User.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Business.hasMany(User, { foreignKey: 'business_id', as: 'users' });

  // User-Business (many-to-many) relations
  User.belongsToMany(Business, { through: UserBusiness, foreignKey: 'user_id', as: 'businesses' });
  Business.belongsToMany(User, { through: UserBusiness, foreignKey: 'business_id', as: 'members' });

  // PaymentConfig relations
  PaymentConfig.belongsTo(Business, { foreignKey: 'business_id', as: 'business' });
  Business.hasMany(PaymentConfig, { foreignKey: 'business_id', as: 'paymentConfigs' });
};

// Inicializar relaciones
initializeRelations();

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
  Product,
  ProductOption,
  ProductOptionRecipe,
  ProductRecipe,
  Promotion,
  PromotionProduct,
  User,
  UserBusiness,
};

export default sequelize;

