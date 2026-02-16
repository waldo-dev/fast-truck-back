import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface InventoryLocationAttributes {
  id: number;
  inventory_item_id: number | null;
  location_id: number | null;
  event_id: number | null;
  stock: number;
}

interface InventoryLocationCreationAttributes extends Optional<InventoryLocationAttributes, 'id' | 'inventory_item_id' | 'location_id' | 'event_id' | 'stock'> {}

export class InventoryLocation extends Model<InventoryLocationAttributes, InventoryLocationCreationAttributes> implements InventoryLocationAttributes {
  public id!: number;
  public inventory_item_id!: number | null;
  public location_id!: number | null;
  public event_id!: number | null;
  public stock!: number;
}

InventoryLocation.init(
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
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
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
    stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'inventory_locations',
    timestamps: false,
  }
);


