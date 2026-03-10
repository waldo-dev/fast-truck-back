import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface OrderItemAttributes {
  id: number;
  order_id: number | null;
  product_id: number | null;
  quantity: number;
  unit_price: number;
  cost: number | null;
  notes: string | null;
}

interface OrderItemCreationAttributes
  extends Optional<OrderItemAttributes, 'id' | 'order_id' | 'product_id' | 'notes' | 'cost'> {}

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number | null;
  public product_id!: number | null;
  public quantity!: number;
  public unit_price!: number;
  public cost!: number | null;
  public notes!: string | null;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: false,
  }
);


