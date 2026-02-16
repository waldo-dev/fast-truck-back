import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { PaymentProvider, PaymentEnvironment } from './enums';

interface PaymentConfigAttributes {
  id: number;
  business_id: number;
  provider: PaymentProvider;
  commerce_code: string;
  api_key: string;
  environment: PaymentEnvironment;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PaymentConfigCreationAttributes extends Optional<PaymentConfigAttributes, 'id' | 'environment' | 'active' | 'created_at' | 'updated_at'> {}

export class PaymentConfig extends Model<PaymentConfigAttributes, PaymentConfigCreationAttributes> implements PaymentConfigAttributes {
  public id!: number;
  public business_id!: number;
  public provider!: PaymentProvider;
  public commerce_code!: string;
  public api_key!: string;
  public environment!: PaymentEnvironment;
  public active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

PaymentConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'businesses',
        key: 'id',
      },
      onDelete: 'CASCADE',
      unique: 'unique_business_provider',
    },
    provider: {
      type: DataTypes.ENUM(...Object.values(PaymentProvider)),
      allowNull: false,
      unique: 'unique_business_provider',
    },
    commerce_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    api_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    environment: {
      type: DataTypes.ENUM(...Object.values(PaymentEnvironment)),
      allowNull: true,
      defaultValue: PaymentEnvironment.TEST,
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'payment_configs',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['business_id', 'provider'],
        name: 'unique_business_provider',
      },
    ],
  }
);

