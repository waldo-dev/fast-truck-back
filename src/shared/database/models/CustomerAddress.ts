import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface CustomerAddressAttributes {
  id: number;
  customer_id: number | null;
  address: string;
  notes: string | null;
  is_default: boolean;
}

interface CustomerAddressCreationAttributes extends Optional<CustomerAddressAttributes, 'id' | 'customer_id' | 'notes' | 'is_default'> {}

export class CustomerAddress extends Model<CustomerAddressAttributes, CustomerAddressCreationAttributes> implements CustomerAddressAttributes {
  public id!: number;
  public customer_id!: number | null;
  public address!: string;
  public notes!: string | null;
  public is_default!: boolean;
}

CustomerAddress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'customer_addresses',
    timestamps: false,
  }
);


