import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export type CashRegisterStatus = 'OPEN' | 'CLOSED';

interface CashRegisterAttributes {
  id: number;
  business_id: number | null;
  location_id: number | null;
  opened_by: string | null;
  closed_by: string | null;
  opened_at: Date | null;
  closed_at: Date | null;
  opening_amount: number | null;
  closing_amount: number | null;
  status: string | null;
  code: number;
}

type CashRegisterCreationAttributes = Optional<CashRegisterAttributes, 'id'>;

export class CashRegister
  extends Model<CashRegisterAttributes, CashRegisterCreationAttributes>
  implements CashRegisterAttributes
{
  public id!: number;
  public business_id!: number | null;
  public location_id!: number | null;
  public opened_by!: string | null;
  public closed_by!: string | null;
  public opened_at!: Date | null;
  public closed_at!: Date | null;
  public opening_amount!: number | null;
  public closing_amount!: number | null;
  public status!: string | null;
  public code!: number;
}

CashRegister.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    opened_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    closed_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    opening_amount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    closing_amount: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'cash_registers',
    timestamps: false,
  }
);








