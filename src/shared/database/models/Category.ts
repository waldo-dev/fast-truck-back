import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface CategoryAttributes {
  id: number;
  business_id: number | null;
  name: string;
  deleted_at: Date | null;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'business_id'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public business_id!: number | null;
  public name!: string;
  public deleted_at!: Date | null;
}

Category.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: false,
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

