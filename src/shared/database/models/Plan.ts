import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface PlanAttributes {
  id: number;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  max_events: number | null;
  max_products: number | null;
  max_users: number | null;
  max_locations: number | null;
  features: any | null;
  active: boolean | null;
  created_at: Date | null;
}

interface PlanCreationAttributes
  extends Optional<
    PlanAttributes,
    | 'id'
    | 'description'
    | 'price_monthly'
    | 'price_yearly'
    | 'max_events'
    | 'max_products'
    | 'max_users'
    | 'max_locations'
    | 'features'
    | 'active'
    | 'created_at'
  > {}

export class Plan extends Model<PlanAttributes, PlanCreationAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public price_monthly!: number | null;
  public price_yearly!: number | null;
  public max_events!: number | null;
  public max_products!: number | null;
  public max_users!: number | null;
  public max_locations!: number | null;
  public features!: any | null;
  public active!: boolean | null;
  public created_at!: Date | null;
}

Plan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price_monthly: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    price_yearly: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    max_events: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_products: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_users: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_locations: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    tableName: 'plans',
    timestamps: false,
  }
);









