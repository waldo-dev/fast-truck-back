import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { PaymentStatus } from './enums';

interface SubscriptionPaymentAttributes {
  id: number;
  subscription_id: number;
  amount: number;
  currency: string | null;
  status: PaymentStatus | null;
  provider: string | null;
  provider_payment_id: string | null;
  paid_at: Date | null;
  created_at: Date | null;
}

interface SubscriptionPaymentCreationAttributes
  extends Optional<
    SubscriptionPaymentAttributes,
    | 'id'
    | 'currency'
    | 'status'
    | 'provider'
    | 'provider_payment_id'
    | 'paid_at'
    | 'created_at'
  > {}

export class SubscriptionPayment
  extends Model<SubscriptionPaymentAttributes, SubscriptionPaymentCreationAttributes>
  implements SubscriptionPaymentAttributes
{
  public id!: number;
  public subscription_id!: number;
  public amount!: number;
  public currency!: string | null;
  public status!: PaymentStatus | null;
  public provider!: string | null;
  public provider_payment_id!: string | null;
  public paid_at!: Date | null;
  public created_at!: Date | null;
}

SubscriptionPayment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'CLP',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: true,
      defaultValue: PaymentStatus.PENDING,
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    provider_payment_id: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
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
    tableName: 'subscription_payments',
    timestamps: false,
  }
);





