import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { OrderSource, OrderStatus, OrderType } from './enums';

interface OrderAttributes {
  id: number;
  business_id: number | null;
  customer_id: number | null;
  address_id: number | null;
  event_id: number | null;
  order_source: OrderSource;
  order_type: OrderType;
  status: OrderStatus;
  total: number;
  created_at: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'business_id' | 'customer_id' | 'address_id' | 'event_id' | 'status' | 'created_at'> {}

export class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public business_id!: number | null;
  public customer_id!: number | null;
  public address_id!: number | null;
  public event_id!: number | null;
  public order_source!: OrderSource;
  public order_type!: OrderType;
  public status!: OrderStatus;
  public total!: number;
  public created_at!: Date;
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
        model: 'businesses',
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
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: false,
  }
);


