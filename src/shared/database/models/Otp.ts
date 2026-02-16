import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface OtpAttributes {
  id: number;
  phone: string;
  code: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

interface OtpCreationAttributes extends Optional<OtpAttributes, 'id' | 'verified' | 'created_at'> {}

export class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
  public id!: number;
  public phone!: string;
  public code!: string;
  public expires_at!: Date;
  public verified!: boolean;
  public created_at!: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'otps',
    timestamps: false,
  }
);


