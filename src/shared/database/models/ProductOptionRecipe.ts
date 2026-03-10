import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ProductOptionRecipeAttributes {
  id: number;
  product_option_id: number | null;
  inventory_item_id: number | null;
  quantity_required: number;
}

interface ProductOptionRecipeCreationAttributes extends Optional<ProductOptionRecipeAttributes, 'id' | 'product_option_id' | 'inventory_item_id'> {}

export class ProductOptionRecipe extends Model<ProductOptionRecipeAttributes, ProductOptionRecipeCreationAttributes> implements ProductOptionRecipeAttributes {
  public id!: number;
  public product_option_id!: number | null;
  public inventory_item_id!: number | null;
  public quantity_required!: number;
}

ProductOptionRecipe.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_option_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'product_options',
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
    tableName: 'product_option_recipes',
    timestamps: false,
  }
);

// Associations set in associations.ts


