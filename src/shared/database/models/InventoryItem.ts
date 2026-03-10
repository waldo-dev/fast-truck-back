import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { InventoryUnit } from './enums';

interface InventoryItemAttributes {
  id: number;
  business_id: number | null;
  name: string;
  unit: InventoryUnit;
  current_stock: number;
  min_stock: number;
  cost_per_item: number | null;
  active: boolean;
  created_at: Date;
}

interface InventoryItemCreationAttributes
  extends Optional<
    InventoryItemAttributes,
    'id' | 'business_id' | 'current_stock' | 'min_stock' | 'cost_per_item' | 'active' | 'created_at'
  > {}

export class InventoryItem extends Model<InventoryItemAttributes, InventoryItemCreationAttributes>
  implements InventoryItemAttributes
{
  public id!: number;
  public business_id!: number | null;
  public name!: string;
  public unit!: InventoryUnit;
  public current_stock!: number;
  public min_stock!: number;
  public cost_per_item!: number | null;
  public active!: boolean;
  public created_at!: Date;
}

InventoryItem.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    unit: {
      type: DataTypes.ENUM(...Object.values(InventoryUnit)),
      allowNull: false,
    },
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    min_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    cost_per_item: {
      field: 'cost_per_items',
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory_items',
    timestamps: false,
  }
);


