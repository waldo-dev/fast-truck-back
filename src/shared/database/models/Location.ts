import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface LocationAttributes {
  id: number;
  business_id: number | null;
  name: string | null;
  address: string | null;
  is_main: boolean;
}

interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'business_id' | 'name' | 'address' | 'is_main'> {}

export class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: number;
  public business_id!: number | null;
  public name!: string | null;
  public address!: string | null;
  public is_main!: boolean;
}

Location.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_main: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'locations',
    timestamps: false,
  }
);

