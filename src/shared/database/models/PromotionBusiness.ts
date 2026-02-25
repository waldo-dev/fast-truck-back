import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface PromotionBusinessAttributes {
  id: number;
  promotion_id: number;
  business_id: number;
}

interface PromotionBusinessCreationAttributes extends Optional<PromotionBusinessAttributes, 'id'> {}

export class PromotionBusiness
  extends Model<PromotionBusinessAttributes, PromotionBusinessCreationAttributes>
  implements PromotionBusinessAttributes
{
  public id!: number;
  public promotion_id!: number;
  public business_id!: number;
}

PromotionBusiness.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    promotion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promotion_business',
    timestamps: false,
  }
);

export default PromotionBusiness;
