import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { InventoryMovementType } from './enums';

interface InventoryMovementAttributes {
  id: number;
  inventory_item_id: number | null;
  business_id: number | null;
  order_id: number | null;
  event_id: number | null;
  movement_type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  created_at: Date;
}

interface InventoryMovementCreationAttributes extends Optional<InventoryMovementAttributes, 'id' | 'inventory_item_id' | 'business_id' | 'order_id' | 'event_id' | 'reason' | 'created_at'> {}

export class InventoryMovement extends Model<InventoryMovementAttributes, InventoryMovementCreationAttributes> implements InventoryMovementAttributes {
  public id!: number;
  public inventory_item_id!: number | null;
  public business_id!: number | null;
  public order_id!: number | null;
  public event_id!: number | null;
  public movement_type!: InventoryMovementType;
  public quantity!: number;
  public reason!: string | null;
  public created_at!: Date;
}

InventoryMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inventory_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'businesses',
        key: 'id',
      },
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
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
    movement_type: {
      type: DataTypes.ENUM(...Object.values(InventoryMovementType)),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory_movements',
    timestamps: false,
  }
);

