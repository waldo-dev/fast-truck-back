import { AppError } from '../../shared/errors';
import { UserRole, OrderSource, OrderStatus } from '../../shared/database/models/enums';
import { orderRepository } from './order.repository';

export class OrderService {
  public async getAllOrders(
    businessId: number,
    filters?: { status?: OrderStatus; order_source?: OrderSource; customer_id?: number }
  ) {
    const orders = await orderRepository.findAll(businessId, filters);
    return orders;
  }

  public async getOrderById(id: number, businessId: number) {
    const order = await orderRepository.findById(id, businessId);
    return order;
  }

  public async createOrder(
    data: {
      customer_id: number;
      address_id?: number | null;
      event_id?: number | null;
      order_source: OrderSource;
      order_type: string;
      status?: OrderStatus;
      items: Array<{
        product_id: number;
        quantity: number;
        selected_option_ids?: number[];
        notes?: string | null;
      }>;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Validar permisos: Staff solo puede crear pedidos WHATSAPP
    if (userRole === UserRole.STAFF && data.order_source !== OrderSource.WHATSAPP) {
      throw new AppError('STAFF can only create WHATSAPP orders', 403);
    }

    const order = await orderRepository.create({
      business_id: businessId,
      customer_id: data.customer_id,
      address_id: data.address_id,
      event_id: data.event_id,
      order_source: data.order_source,
      order_type: data.order_type as any,
      status: data.status,
      items: data.items,
    });

    return order;
  }

  public async updateOrderStatus(
    id: number,
    businessId: number,
    status: OrderStatus,
    userRole: UserRole
  ) {
    // Solo ADMIN puede cambiar estados
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update order status', 403);
    }

    const order = await orderRepository.updateStatus(id, businessId, status);
    return order;
  }

  public async deleteOrder(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar órdenes
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete orders', 403);
    }

    await orderRepository.delete(id, businessId);
  }
}

export const orderService = new OrderService();


