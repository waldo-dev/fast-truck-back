import { Op } from 'sequelize';
import { Event, Location, Product, EventProduct, EventOrganizer } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class EventRepository {
  public async findAll(businessId: number, filters?: { future_only?: boolean; is_active?: boolean }) {
    const where: any = {
      business_id: businessId,
    };

    // Si se solicita solo eventos futuros
    if (filters?.future_only) {
      const todayStr = new Date().toISOString().slice(0, 10);
      console.log("🚀 ~ EventRepository ~ findAll ~ todayStr:", todayStr)
      where.event_date = { [Op.gte]: todayStr };
    }

    if (typeof filters?.is_active === 'boolean') {
      where.is_active = filters.is_active;
    }

    const events = await Event.findAll({
      where,
      include: [
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
        },
        {
          model: EventOrganizer,
          as: 'organizers',
          attributes: ['id', 'name', 'role', 'email', 'phone', 'notes'],
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
        {
          model: EventOrganizer,
          as: 'organizers',
          attributes: ['id', 'name', 'role', 'email', 'phone', 'notes'],
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
    event_date?: string | null; // YYYY-MM-DD
    organizer?: string | null;
    notes?: string | null;
    event_type?: string | null;
    expected_attendance?: number | null;
    weather_condition?: string | null;
    start_at?: Date | null;
    end_at?: Date | null;
    city?: string | null;
    district?: string | null;
    status?: string | null;
    closed_at?: Date | null;
    is_active?: boolean | null;
    product_ids?: number[];
    organizers?: Array<{
      name: string;
      role?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }>;
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

    // Validar productos si se envían
    let uniqueProductIds: number[] = [];
    if (data.product_ids && data.product_ids.length > 0) {
      uniqueProductIds = Array.from(new Set(data.product_ids));
      const count = await Product.count({
        where: {
          id: { [Op.in]: uniqueProductIds },
          business_id: data.business_id,
        },
      });
      if (count !== uniqueProductIds.length) {
        throw new AppError('Some products do not belong to this business', 400);
      }
    }

    // Para DATEONLY no convertir a Date; guardar la cadena YYYY-MM-DD tal cual
    const eventPayload = {
      ...data,
      event_date: data.event_date === null ? null : data.event_date ?? undefined,
    };

    const event = await Event.create(eventPayload);

    if (uniqueProductIds.length > 0) {
      const rows = uniqueProductIds.map((pid) => ({
        event_id: event.id,
        product_id: pid,
        active: true,
      }));
      await EventProduct.bulkCreate(rows, { ignoreDuplicates: true });
    }

    if (data.organizers && data.organizers.length > 0) {
      const orgRows = data.organizers.map((org) => ({
        event_id: event.id,
        name: org.name,
        role: org.role ?? null,
        email: org.email ?? null,
        phone: org.phone ?? null,
        notes: org.notes ?? null,
      }));
      await EventOrganizer.bulkCreate(orgRows);
    }

    return this.findById(event.id, data.business_id);
  }
}

export const eventRepository = new EventRepository();


