import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { eventRepository } from './event.repository';

export class EventService {
  public async getAllEvents(businessId: number, futureOnly: boolean = false) {
    const events = await eventRepository.findAll(businessId, { future_only: futureOnly });
    return events;
  }

  public async getEventById(id: number, businessId: number) {
    const event = await eventRepository.findById(id, businessId);
    return event;
  }

  public async createEvent(
    data: {
      location_id?: number | null;
      name?: string | null;
      description?: string | null;
      event_date?: string | null;
      organizer?: string | null;
      notes?: string | null;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear eventos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create events', 403);
    }

    const event = await eventRepository.create({
      business_id: businessId,
      location_id: data.location_id,
      name: data.name,
      description: data.description,
      event_date: data.event_date ? new Date(data.event_date) : null,
      organizer: data.organizer,
      notes: data.notes,
    });

    return event;
  }
}

export const eventService = new EventService();


