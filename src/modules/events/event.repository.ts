import { Op } from 'sequelize';
import { Event, Location } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class EventRepository {
  public async findAll(businessId: number, filters?: { future_only?: boolean }) {
    const where: any = {
      business_id: businessId,
    };

    // Si se solicita solo eventos futuros
    if (filters?.future_only) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.event_date = { [Op.gte]: today };
    }

    const events = await Event.findAll({
      where,
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
      order: [['event_date', 'ASC']],
    });

    return events;
  }

  public async findById(id: number, businessId: number) {
    const event = await Event.findOne({
      where: {
        id,
        business_id: businessId,
      },
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
      ],
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return event;
  }

  public async create(data: {
    business_id: number;
    location_id?: number | null;
    name?: string | null;
    description?: string | null;
    event_date?: Date | null;
    organizer?: string | null;
    notes?: string | null;
  }) {
    // Validar location si se proporciona
    if (data.location_id) {
      const location = await Location.findOne({
        where: {
          id: data.location_id,
          business_id: data.business_id,
        },
      });

      if (!location) {
        throw new AppError('Location not found', 400);
      }
    }

    const event = await Event.create(data);
    return this.findById(event.id, data.business_id);
  }
}

export const eventRepository = new EventRepository();

