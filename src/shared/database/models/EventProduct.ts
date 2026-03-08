import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../connection';

interface EventProductAttributes {
  event_id: number;
  product_id: number;
  active: boolean | null;
}

export class EventProduct extends Model<EventProductAttributes> implements EventProductAttributes {
  public event_id!: number;
  public product_id!: number;
  public active!: boolean | null;
}

EventProduct.init(
  {
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'event_products',
    timestamps: false,
  }
);




