import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ProductBusinessAttributes {
  id: number;
  product_id: number | null;
  business_id: number | null;
}

interface ProductBusinessCreationAttributes extends Optional<ProductBusinessAttributes, 'id'> {}

export class ProductBusiness
  extends Model<ProductBusinessAttributes, ProductBusinessCreationAttributes>
  implements ProductBusinessAttributes
{
  public id!: number;
  public product_id!: number | null;
  public business_id!: number | null;
}

ProductBusiness.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'product_business',
    timestamps: false,
  }
);

export default ProductBusiness;
