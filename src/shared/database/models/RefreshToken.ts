import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface RefreshTokenAttributes {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  'id' | 'revoked_at' | 'created_at'
>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public expires_at!: Date;
  public revoked_at!: Date | null;
  public created_at!: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: false,
  }
);





