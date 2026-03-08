import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

export type BusinessOperatingMode = 'LOCAL' | 'EVENT';

interface BusinessOperatingContextAttributes {
  business_id: number;
  mode: BusinessOperatingMode;
  location_id: number | null;
  event_id: number | null;
  updated_at: Date | null;
}

interface BusinessOperatingContextCreationAttributes
  extends Optional<BusinessOperatingContextAttributes, 'location_id' | 'event_id' | 'updated_at'> {}

export class BusinessOperatingContext
  extends Model<BusinessOperatingContextAttributes, BusinessOperatingContextCreationAttributes>
  implements BusinessOperatingContextAttributes
{
  public business_id!: number;
  public mode!: BusinessOperatingMode;
  public location_id!: number | null;
  public event_id!: number | null;
  public updated_at!: Date | null;
}

BusinessOperatingContext.init(
  {
    business_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'business',
        key: 'id',
      },
    },
    mode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['LOCAL', 'EVENT']],
      },
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'business_operating_context',
    timestamps: false,
  }
);




