import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface PromotionProductAttributes {
  promotion_id: number;
  product_id: number;
}

interface PromotionProductCreationAttributes extends PromotionProductAttributes {}

export class PromotionProduct extends Model<PromotionProductAttributes, PromotionProductCreationAttributes> implements PromotionProductAttributes {
  public promotion_id!: number;
  public product_id!: number;
}

PromotionProduct.init(
  {
    promotion_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'promotions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'promotion_products',
    timestamps: false,
  }
);

