import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface BusinessAttributes {
  id: number;
  name: string;
  brand_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  is_active: boolean;
  created_at: Date;
}

interface BusinessCreationAttributes
  extends Optional<
    BusinessAttributes,
    'id' | 'brand_name' | 'logo_url' | 'primary_color' | 'secondary_color' | 'is_active' | 'created_at'
  > {}

export class Business extends Model<BusinessAttributes, BusinessCreationAttributes> implements BusinessAttributes {
  public id!: number;
  public name!: string;
  public brand_name!: string | null;
  public logo_url!: string | null;
  public primary_color!: string | null;
  public secondary_color!: string | null;
  public is_active!: boolean;
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


