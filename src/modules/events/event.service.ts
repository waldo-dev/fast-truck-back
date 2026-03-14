import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { eventRepository } from './event.repository';
import { Location } from '../../shared/database/models';

export class EventService {
  public async getAllEvents(businessId: number, futureOnly: boolean = false, isActive?: boolean) {
    const events = await eventRepository.findAll(businessId, { future_only: futureOnly, is_active: isActive });
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
      event_date?: string | null; // YYYY-MM-DD (no convertir a Date para preservar la fecha exacta)
      organizer?: string | null;
      notes?: string | null;
      event_type?: string | null;
      expected_attendance?: number | null;
      weather_condition?: string | null;
      start_at?: string | null;
      end_at?: string | null;
      city?: string | null;
      district?: string | null;
      status?: string | null;
      closed_at?: string | null;
      is_active?: boolean | null;
      product_ids?: number[];
      organizers?: Array<{
        name: string;
        role?: string | null;
        email?: string | null;
        phone?: string | null;
        notes?: string | null;
      }>;
      address?: string;
      location_name?: string;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // ADMIN, BUSINESS_OWNER o LOCAL_OPERATOR
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR].includes(userRole)) {
      throw new AppError('Not authorized to create events', 403);
    }

    // Si no viene location_id pero sí una dirección, crear un Location y usar su id
    let locationIdToUse = data.location_id ?? null;
    if (!locationIdToUse && data.address) {
      const locationName = data.location_name || `${data.name || 'Event'} - ${data.address}`;
      const location = await Location.create({
        business_id: businessId,
        name: locationName,
        address: data.address,
        is_main: false,
      });
      locationIdToUse = location.id;
    }

    const event = await eventRepository.create({
      business_id: businessId,
      location_id: locationIdToUse,
      name: data.name,
      description: data.description,
      event_date: data.event_date ?? null, // mantener string YYYY-MM-DD
      organizer: data.organizer,
      notes: data.notes,
      event_type: data.event_type,
      expected_attendance: data.expected_attendance ?? null,
      weather_condition: data.weather_condition,
      start_at: data.start_at ? new Date(data.start_at) : null,
      end_at: data.end_at ? new Date(data.end_at) : null,
      city: data.city,
      district: data.district,
      status: data.status,
      closed_at: data.closed_at ? new Date(data.closed_at) : null,
      is_active: data.is_active ?? true,
      product_ids: data.product_ids,
      organizers: data.organizers,
    });

    return event;
  }

  public async getSummary(eventId: number, businessId: number) {
    return eventRepository.getSummary(eventId, businessId);
  }

  public async getAnalytics(businessId: number, limit?: number) {
    return eventRepository.getAnalytics(businessId, limit);
  }

  public async addExpense(
    eventId: number,
    businessId: number,
    data: { type?: string | null; description?: string | null; amount: number }
  ) {
    return eventRepository.addExpense({
      event_id: eventId,
      ...data,
    });
  }

  public async listExpenses(eventId: number, businessId?: number | null) {
    console.log("🚀 ~ EventService ~ listExpenses ~ businessId:", businessId)
    return eventRepository.listExpenses(eventId);
  }

  public async deleteExpense(eventId: number, expenseId: number, businessId: number) {
    return eventRepository.deleteExpense(eventId, expenseId, businessId);
  }
}

export const eventService = new EventService();


