import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface CustomerAttributes {
  id: number;
  business_id: number | null;
  name: string;
  phone: string;
  notes: string | null;
  created_at: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'business_id' | 'notes' | 'created_at'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public business_id!: number | null;
  public name!: string;
  public phone!: string;
  public notes!: string | null;
  public created_at!: Date;
}

Customer.init(
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
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'customers',
    timestamps: false,
  }
);

