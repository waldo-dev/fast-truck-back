import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface EventAttributes {
  id: number;
  business_id: number | null;
  location_id: number | null;
  name: string | null;
  description: string | null;
  event_date: Date | null;
  organizer: string | null;
  notes: string | null;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'business_id' | 'location_id' | 'name' | 'description' | 'event_date' | 'organizer' | 'notes'> {}

export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: number;
  public business_id!: number | null;
  public location_id!: number | null;
  public name!: string | null;
  public description!: string | null;
  public event_date!: Date | null;
  public organizer!: string | null;
  public notes!: string | null;
}

Event.init(
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
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    organizer: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: false,
  }
);

