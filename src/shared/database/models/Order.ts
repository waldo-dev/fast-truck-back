import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { OrderSource, OrderStatus, OrderType, PaymentMethod } from './enums';

interface OrderAttributes {
  id: number;
  business_id: number | null;
  customer_id: number | null;
  address_id: number | null;
  event_id: number | null;
  payment_type: PaymentMethod | null;
  order_source: OrderSource;
  order_type: OrderType;
  status: OrderStatus;
  total: number;
  created_at: Date;
  confirmed_at: Date | null;
  ready_at: Date | null;
  delivered_at: Date | null;
  preparing_at: Date | null;
  cancelled_at: Date | null;
  is_new_customer: boolean | null;
}

interface OrderCreationAttributes
  extends Optional<
    OrderAttributes,
    | 'id'
    | 'business_id'
    | 'customer_id'
    | 'address_id'
    | 'event_id'
    | 'payment_type'
    | 'status'
    | 'created_at'
    | 'confirmed_at'
    | 'ready_at'
    | 'delivered_at'
    | 'preparing_at'
    | 'cancelled_at'
    | 'is_new_customer'
  > {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public business_id!: number | null;
  public customer_id!: number | null;
  public address_id!: number | null;
  public event_id!: number | null;
  public payment_type!: PaymentMethod | null;
  public order_source!: OrderSource;
  public order_type!: OrderType;
  public status!: OrderStatus;
  public total!: number;
  public created_at!: Date;
  public confirmed_at!: Date | null;
  public ready_at!: Date | null;
  public delivered_at!: Date | null;
  public preparing_at!: Date | null;
  public cancelled_at!: Date | null;
  public is_new_customer!: boolean | null;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'business',
        key: 'id',
      },
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    address_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customer_addresses',
        key: 'id',
      },
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    payment_type: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: true,
    },
    order_source: {
      type: DataTypes.ENUM(...Object.values(OrderSource)),
      allowNull: false,
    },
    order_type: {
      type: DataTypes.ENUM(...Object.values(OrderType)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: true,
      defaultValue: OrderStatus.CREATED,
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ready_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    preparing_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_new_customer: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: false,
  }
);


