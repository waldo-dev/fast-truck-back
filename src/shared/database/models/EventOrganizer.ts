import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface EventOrganizerAttributes {
  id: number;
  event_id: number;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: Date | null;
}

interface EventOrganizerCreationAttributes
  extends Optional<EventOrganizerAttributes, 'id' | 'role' | 'email' | 'phone' | 'notes' | 'created_at'> {}

export class EventOrganizer
  extends Model<EventOrganizerAttributes, EventOrganizerCreationAttributes>
  implements EventOrganizerAttributes
{
  public id!: number;
  public event_id!: number;
  public name!: string;
  public role!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public notes!: string | null;
  public created_at!: Date | null;
}

EventOrganizer.init(
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'event_organizers',
    timestamps: false,
  }
);

