import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface CashMovementAttributes {
  id: number;
  cash_register_id: number | null;
  type: string | null;
  amount: number | null;
  payment_method: string | null;
  order_id: number | null;
  opcional: string | null;
  notes: string | null;
}

type CashMovementCreationAttributes = Optional<CashMovementAttributes, 'id'>;

export class CashMovement
  extends Model<CashMovementAttributes, CashMovementCreationAttributes>
  implements CashMovementAttributes
{
  public id!: number;
  public cash_register_id!: number | null;
  public type!: string | null;
  public amount!: number | null;
  public payment_method!: string | null;
  public order_id!: number | null;
  public opcional!: string | null;
  public notes!: string | null;
}

CashMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cash_register_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    opcional: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'cash_movements',
    timestamps: false,
  }
);





