import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ProductBusinessAttributes {
  id: number;
  user_id: number;
  business_id: number;
}

interface ProductBusinessCreationAttributes extends Optional<ProductBusinessAttributes, 'id'> {}

export class ProductBusiness
  extends Model<ProductBusinessAttributes, ProductBusinessCreationAttributes>
  implements ProductBusinessAttributes
{
  public id!: number;
  public user_id!: number;
  public business_id!: number;
}

ProductBusiness.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
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
    tableName: 'product_business',
    timestamps: false,
  }
);

export default ProductBusiness;
