import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

import { BusinessStatus } from './enums';

interface BusinessAttributes {
  id: number;
  name: string;
  brand_name: string | null;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_active: boolean;
  status: BusinessStatus;
  created_at: Date;
}

interface BusinessCreationAttributes
  extends Optional<
    BusinessAttributes,
    | 'id'
    | 'brand_name'
    | 'slug'
    | 'logo_url'
    | 'primary_color'
    | 'secondary_color'
    | 'is_active'
    | 'status'
    | 'created_at'
  > {}

export class Business extends Model<BusinessAttributes, BusinessCreationAttributes> implements BusinessAttributes {
  public id!: number;
  public name!: string;
  public brand_name!: string | null;
  public slug!: string | null;
  public logo_url!: string | null;
  public primary_color!: string | null;
  public secondary_color!: string | null;
  public is_active!: boolean;
  public status!: BusinessStatus;
  public created_at!: Date;
}

Business.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    brand_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    primary_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    secondary_color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BusinessStatus)),
      allowNull: false,
      defaultValue: BusinessStatus.ACTIVE,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'business',
    timestamps: false,
  }
);


