import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ProductOptionAttributes {
  id: number;
  product_id: number | null;
  option_type: string | null;
  option_value: string | null;
  extra_price: number;
}

interface ProductOptionCreationAttributes extends Optional<ProductOptionAttributes, 'id' | 'product_id' | 'option_type' | 'option_value' | 'extra_price'> {}

export class ProductOption extends Model<ProductOptionAttributes, ProductOptionCreationAttributes> implements ProductOptionAttributes {
  public id!: number;
  public product_id!: number | null;
  public option_type!: string | null;
  public option_value!: string | null;
  public extra_price!: number;
}

ProductOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    option_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    option_value: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    extra_price: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'product_options',
    timestamps: false,
  }
);


