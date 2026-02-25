import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface UserBusinessAttributes {
  id: number;
  user_id: number;
  business_id: number;
}

interface UserBusinessCreationAttributes extends Optional<UserBusinessAttributes, 'id'> {}

export class UserBusiness extends Model<UserBusinessAttributes, UserBusinessCreationAttributes> implements UserBusinessAttributes {
  public id!: number;
  public user_id!: number;
  public business_id!: number;
}

UserBusiness.init(
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
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_business',
    timestamps: false,
  }
);

export default UserBusiness;
