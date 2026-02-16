import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ProductRecipeAttributes {
  id: number;
  product_id: number | null;
  inventory_item_id: number | null;
  quantity_required: number;
}

interface ProductRecipeCreationAttributes extends Optional<ProductRecipeAttributes, 'id' | 'product_id' | 'inventory_item_id'> {}

export class ProductRecipe extends Model<ProductRecipeAttributes, ProductRecipeCreationAttributes> implements ProductRecipeAttributes {
  public id!: number;
  public product_id!: number | null;
  public inventory_item_id!: number | null;
  public quantity_required!: number;
}

ProductRecipe.init(
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
    inventory_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventory_items',
        key: 'id',
      },
    },
    quantity_required: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'product_recipes',
    timestamps: false,
  }
);


