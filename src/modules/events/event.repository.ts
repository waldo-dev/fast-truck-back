import { Op, fn, col, literal } from 'sequelize';
import {
  Event,
  Location,
  Product,
  EventProduct,
  EventOrganizer,
  Order,
  OrderItem,
  Payment,
  EventExpense,
} from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../shared/database/models/enums';

export class EventRepository {
  public async findAll(businessId: number, filters?: { future_only?: boolean; is_active?: boolean }) {
    const where: any = {
      business_id: businessId,
    };

    // Si se solicita solo eventos futuros
    if (filters?.future_only) {
      const todayStr = new Date().toISOString().slice(0, 10);
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

  public async getSummary(eventId: number, businessId: number) {
    const event = await Event.findOne({
      where: { id: eventId, business_id: businessId },
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

    const orders = await Order.findAll({
      where: { business_id: businessId, event_id: eventId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['product_id', 'quantity', 'unit_price'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['payment_method', 'payment_status', 'amount'],
        },
      ],
    });

    const validOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const tickets = validOrders.length;
    const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const avgTicket = tickets > 0 ? totalSales / tickets : 0;

    const paymentBreakdown: Record<string, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.DEBIT_CARD]: 0,
      [PaymentMethod.CREDIT_CARD]: 0,
      [PaymentMethod.TRANSFER]: 0,
      [PaymentMethod.WEBPAY]: 0,
      OTHER: 0,
    };

    for (const order of validOrders) {
      const payments = (order as any).payments as Array<Payment> | undefined;
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          if (payment.payment_status === PaymentStatus.FAILED) continue;
          const method = payment.payment_method || 'OTHER';
          paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(payment.amount || 0);
        }
      } else if ((order as any).payment_type) {
        const method = (order as any).payment_type || 'OTHER';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(order.total || 0);
      }
    }

    const productStats: Record<
      number,
      { product_id: number; name: string; quantity: number; revenue: number }
    > = {};

    for (const order of validOrders) {
      const items = (order as any).items as Array<OrderItem> | undefined;
      if (!items) continue;
      for (const item of items) {
        const pid = item.product_id;
        if (!pid) continue;
        const name = (item as any).product?.name || 'Sin nombre';
        const revenue = Number(item.unit_price || 0) * Number(item.quantity || 0);
        if (!productStats[pid]) {
          productStats[pid] = { product_id: pid, name, quantity: 0, revenue: 0 };
        }
        productStats[pid].quantity += Number(item.quantity || 0);
        productStats[pid].revenue += revenue;
      }
    }

    const topProducts = Object.values(productStats).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    const expensesRows = await EventExpense.findAll({
      where: { event_id: eventId },
      attributes: ['id', 'type', 'description', 'amount', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    const expensesTotal = expensesRows.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const margin = totalSales - expensesTotal;
    const marginPct = totalSales > 0 ? margin / totalSales : 0;

    return {
      event,
      sales: totalSales,
      tickets,
      avg_ticket: avgTicket,
      payment_breakdown: paymentBreakdown,
      top_products: topProducts,
      expenses: {
        total: expensesTotal,
        items: expensesRows,
      },
      margin,
      margin_pct: marginPct,
    };
  }

  public async getAnalytics(businessId: number, limit: number = 10) {
    const salesRows = await Order.findAll({
      where: {
        business_id: businessId,
        event_id: { [Op.ne]: null },
      },
      attributes: [
        'event_id',
        [
          fn(
            'SUM',
            literal(`CASE WHEN status <> '${OrderStatus.CANCELLED}' THEN total ELSE 0 END`)
          ),
          'sales',
        ],
        [
          fn(
            'SUM',
            literal(`CASE WHEN status <> '${OrderStatus.CANCELLED}' THEN 1 ELSE 0 END`)
          ),
          'tickets',
        ],
      ],
      group: ['event_id'],
      having: literal('event_id IS NOT NULL'),
    });

    const eventIds = salesRows
      .map((row) => row.get('event_id') as number | null)
      .filter((id): id is number => !!id);

    const expenseRows = await EventExpense.findAll({
      where: { event_id: { [Op.in]: eventIds } },
      attributes: ['event_id', [fn('SUM', col('amount')), 'expenses']],
      group: ['event_id'],
    });

    const expenseMap = expenseRows.reduce<Record<number, number>>((acc, row) => {
      const eid = (row.get('event_id') as number) || 0;
      const exp = Number(row.get('expenses') as any) || 0;
      acc[eid] = exp;
      return acc;
    }, {});

    const events = await Event.findAll({
      where: { id: { [Op.in]: eventIds }, business_id: businessId },
      attributes: ['id', 'name', 'event_date', 'event_type'],
      order: [['event_date', 'DESC']],
    });

    const analytics = salesRows
      .map((row) => {
        const eventId = row.get('event_id') as number;
        const sales = Number(row.get('sales') as any) || 0;
        const tickets = Number(row.get('tickets') as any) || 0;
        const expenses = expenseMap[eventId] || 0;
        const margin = sales - expenses;
        const marginPct = sales > 0 ? margin / sales : 0;
        const eventInfo = events.find((e) => e.id === eventId);
        return {
          event_id: eventId,
          name: eventInfo?.name || 'Evento',
          event_date: eventInfo?.event_date || null,
          event_type: eventInfo?.event_type || null,
          sales,
          tickets,
          expenses,
          margin,
          margin_pct: marginPct,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit);

    return analytics;
  }

  public async addExpense(data: {
    event_id: number;
    business_id: number;
    type?: string | null;
    description?: string | null;
    amount: number;
  }) {
    const event = await Event.findOne({
      where: { id: data.event_id, business_id: data.business_id },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const expense = await EventExpense.create({
      event_id: data.event_id,
      type: data.type ?? null,
      description: data.description ?? null,
      amount: data.amount,
    });

    return expense;
  }

  public async listExpenses(eventId: number, businessId: number) {
    const event = await Event.findOne({
      where: { id: eventId, business_id: businessId },
    });

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    return EventExpense.findAll({
      where: { event_id: eventId },
      order: [['created_at', 'DESC']],
    });
  }

  public async deleteExpense(eventId: number, expenseId: number, businessId: number) {
    const expense = await EventExpense.findOne({
      where: { id: expenseId, event_id: eventId },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'business_id'],
        },
      ],
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    const expEvent = (expense as any).event as Event | undefined;
    if (!expEvent || expEvent.business_id !== businessId) {
      throw new AppError('Expense not found', 404);
    }

    await expense.destroy();
  }
}

export const eventRepository = new EventRepository();


