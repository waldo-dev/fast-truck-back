import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { SubscriptionStatus } from './enums';

interface SubscriptionAttributes {
  id: number;
  business_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  trial_ends_at: Date | null;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean | null;
  payment_provider: string | null;
  provider_subscription_id: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface SubscriptionCreationAttributes
  extends Optional<
    SubscriptionAttributes,
    | 'id'
    | 'status'
    | 'trial_ends_at'
    | 'current_period_start'
    | 'current_period_end'
    | 'cancel_at_period_end'
    | 'payment_provider'
    | 'provider_subscription_id'
    | 'created_at'
    | 'updated_at'
  > {}

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: number;
  public business_id!: number;
  public plan_id!: number;
  public status!: SubscriptionStatus;
  public trial_ends_at!: Date | null;
  public current_period_start!: Date | null;
  public current_period_end!: Date | null;
  public cancel_at_period_end!: boolean | null;
  public payment_provider!: string | null;
  public provider_subscription_id!: string | null;
  public created_at!: Date | null;
  public updated_at!: Date | null;
}

Subscription.init(
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
        model: 'business',
        key: 'id',
      },
    },
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plans',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      allowNull: false,
      defaultValue: SubscriptionStatus.TRIAL,
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    current_period_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    current_period_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancel_at_period_end: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    payment_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    provider_subscription_id: {
      type: DataTypes.STRING(150),
      allowNull: true,
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
    tableName: 'subscriptions',
    timestamps: false,
  }
);












