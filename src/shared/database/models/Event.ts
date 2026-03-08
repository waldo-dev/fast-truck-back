import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface EventAttributes {
  id: number;
  business_id: number | null;
  location_id: number | null;
  name: string | null;
  description: string | null;
  // DATEONLY en Sequelize se maneja como string (YYYY-MM-DD)
  event_date: string | null;
  organizer: string | null;
  notes: string | null;
  event_type: string | null;
  expected_attendance: number | null;
  weather_condition: string | null;
  start_at: Date | null;
  end_at: Date | null;
  city: string | null;
  district: string | null;
  status: string | null;
  closed_at: Date | null;
  is_active: boolean | null;
}

interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    | 'id'
    | 'business_id'
    | 'location_id'
    | 'name'
    | 'description'
    | 'event_date'
    | 'organizer'
    | 'notes'
    | 'event_type'
    | 'expected_attendance'
    | 'weather_condition'
    | 'start_at'
    | 'end_at'
    | 'city'
    | 'district'
    | 'status'
    | 'closed_at'
    | 'is_active'
  > {}

export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: number;
  public business_id!: number | null;
  public location_id!: number | null;
  public name!: string | null;
  public description!: string | null;
  public event_date!: string | null;
  public organizer!: string | null;
  public notes!: string | null;
  public event_type!: string | null;
  public expected_attendance!: number | null;
  public weather_condition!: string | null;
  public start_at!: Date | null;
  public end_at!: Date | null;
  public city!: string | null;
  public district!: string | null;
  public status!: string | null;
  public closed_at!: Date | null;
  public is_active!: boolean | null;
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
        model: 'business',
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
    event_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expected_attendance: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    weather_condition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: false,
  }
);


