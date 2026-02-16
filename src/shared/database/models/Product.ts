import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';
import { ProductStatus } from './enums';

interface ProductAttributes {
  id: number;
  business_id: number | null;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: ProductStatus;
  created_at: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'business_id' | 'category_id' | 'description' | 'image_url' | 'status' | 'created_at'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public business_id!: number | null;
  public category_id!: number | null;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public image_url!: string | null;
  public status!: ProductStatus;
  public created_at!: Date;
}

Product.init(
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
        model: 'businesses',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProductStatus)),
      allowNull: true,
      defaultValue: ProductStatus.ACTIVE,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: false,
  }
);


