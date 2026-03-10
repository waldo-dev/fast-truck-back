import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface EventExpenseAttributes {
  id: number;
  event_id: number;
  type: string | null;
  description: string | null;
  amount: number;
  created_at: Date | null;
}

type EventExpenseCreationAttributes = Optional<EventExpenseAttributes, 'id' | 'type' | 'description' | 'created_at'>;

export class EventExpense extends Model<EventExpenseAttributes, EventExpenseCreationAttributes>
  implements EventExpenseAttributes
{
  public id!: number;
  public event_id!: number;
  public type!: string | null;
  public description!: string | null;
  public amount!: number;
  public created_at!: Date | null;
}

EventExpense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'event_expenses',
    timestamps: false,
  }
);


