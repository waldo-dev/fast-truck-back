import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { PaymentMethod, PaymentStatus } from './enums';

interface PaymentAttributes {
  id: number;
  order_id: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount: number;
  paid_at: Date | null;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'order_id' | 'payment_status' | 'paid_at'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public order_id!: number | null;
  public payment_method!: PaymentMethod;
  public payment_status!: PaymentStatus;
  public amount!: number;
  public paid_at!: Date | null;
}

Payment.init(
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
    payment_method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: true,
      defaultValue: PaymentStatus.PENDING,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: false,
  }
);


