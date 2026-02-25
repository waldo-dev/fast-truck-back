import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { DiscountType } from './enums';

interface PromotionAttributes {
  id: number;
  business_id: number | null;
  name: string;
  description: string | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  start_date: Date | null;
  end_date: Date | null;
  active: boolean;
}

interface PromotionCreationAttributes extends Optional<PromotionAttributes, 'id' | 'business_id' | 'description' | 'discount_type' | 'discount_value' | 'start_date' | 'end_date' | 'active'> {}

export class Promotion extends Model<PromotionAttributes, PromotionCreationAttributes> implements PromotionAttributes {
  public id!: number;
  public business_id!: number | null;
  public name!: string;
  public description!: string | null;
  public discount_type!: DiscountType | null;
  public discount_value!: number | null;
  public start_date!: Date | null;
  public end_date!: Date | null;
  public active!: boolean;
}

Promotion.init(
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
        model: 'business',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discount_type: {
      type: DataTypes.ENUM(...Object.values(DiscountType)),
      allowNull: true,
    },
    discount_value: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'promotions',
    timestamps: false,
  }
);

