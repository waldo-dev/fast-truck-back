import { AppError } from '../../shared/errors';
import { UserRole, OrderSource, OrderStatus, OrderType, PaymentMethod } from '../../shared/database/models/enums';
import { UserBusiness } from '../../shared/database/models';
import { orderRepository } from './order.repository';
import { customerRepository } from '../customers/customer.repository';

export class OrderService {
  public async getAllOrders(
    businessId: number,
    filters?: { status?: OrderStatus; order_source?: OrderSource; customer_id?: number; event_id?: number }
  ) {
    console.log("🚀 ~ OrderService ~ getAllOrders ~ businessId:", businessId)
    console.log("🚀 ~ OrderService ~ getAllOrders ~ filters:", filters)
    const orders = await orderRepository.findAll(businessId, filters);
    return orders;
  }

  public async getOrderById(id: number) {
    const order = await orderRepository.findById(id,);
    return order;
  }

  public async createOrder(
    data: {
      business_id: number;
      customer_id?: number;
      customer?: {
        name: string;
        phone?: string | null;
        notes?: string | null;
        address?: {
          address: string;
          notes?: string | null;
          is_default?: boolean;
        };
      };
      address_id?: number | null;
      event_id?: number | null;
      payment_method?: PaymentMethod | null;
      order_source: OrderSource;
      order_type: OrderType;
      status?: OrderStatus;
      items: Array<{
        product_id: number;
        quantity: number;
        selected_option_ids?: number[];
        notes?: string | null;
      }>;
    },
  ) {
    // Si el origen es EVENT, el event_id es obligatorio
    if (data.order_source === OrderSource.EVENT && !data.event_id) {
      throw new AppError('event_id is required for EVENT orders', 400);
    }

    // Obtener o crear customer
    let customerId = data.customer_id ?? null;
    if (!customerId && !data.customer) {
      throw new AppError('Customer information is required', 400);
    }

    if (customerId) {
      // Valida pertenencia al negocio
      await customerRepository.findById(customerId, data.business_id);
    } else if (data.customer) {
      const phone = data.customer.phone?.trim() || null;

      if (phone) {
        const existingCustomer = await customerRepository.findByPhone(phone, data.business_id);
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const newCustomer = await customerRepository.create({
            business_id: data.business_id,
            name: data.customer.name,
            phone,
            notes: data.customer.notes || null,
          });
          customerId = newCustomer.id;
        }
      } else {
        // Sin phone: crear un customer rápido con phone temporal
        const tempPhone = `NO_PHONE_${Date.now()}`;
        const newCustomer = await customerRepository.create({
          business_id: data.business_id,
          name: data.customer.name,
          phone: tempPhone,
          notes: data.customer.notes || null,
        });
        customerId = newCustomer.id;
      }
    }

    if (!customerId) {
      throw new AppError('Unable to resolve customer', 400);
    }

    // Resolver dirección para DELIVERY
    let addressId = data.address_id ?? null;
    if (data.order_type === OrderType.DELIVERY) {
      if (addressId) {
        await customerRepository.findAddressById(addressId, customerId);
      } else if (data.customer?.address) {
        const newAddress = await customerRepository.createAddress({
          customer_id: customerId,
          address: data.customer.address.address,
          notes: data.customer.address.notes || null,
          is_default: data.customer.address.is_default ?? true,
        });
        addressId = newAddress.id;
      } else {
        throw new AppError('Address is required for DELIVERY orders', 400);
      }
    } else if (addressId) {
      // Validar que la dirección pertenece al customer si se envía en otros tipos
      await customerRepository.findAddressById(addressId, customerId);
    }

    const order = await orderRepository.create({
      business_id: data.business_id,
      customer_id: customerId,
      address_id: addressId,
      event_id: data.event_id,
      payment_method: data.payment_method ?? null,
      order_source: data.order_source,
      order_type: data.order_type,
      status: data.status,
      items: data.items,
    });

    return order;
  }

  public async updateOrderStatus(
    id: number,
    status: OrderStatus,
    userRole: UserRole
  ) {
    // Roles permitidos: ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR
    const allowedRoles = [UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR];
    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Only ADMIN, BUSINESS_OWNER or LOCAL_OPERATOR can update order status', 403);
    }

    const order = await orderRepository.updateStatus(id, status);
    return order;
  }

  public async deleteOrder(id: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar órdenes
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete orders', 403);
    }

    await orderRepository.delete(id);
  }

  public async getHistory(
    businessId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: OrderStatus;
      order_source?: OrderSource;
      customer_id?: number;
      event_id?: number;
    }
  ) {
    return orderRepository.findHistory(businessId, filters);
  }

  public async getCloseout(
    businessId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      vatRate?: number;
      event_id?: number;
    }
  ) {
    return orderRepository.findCloseout(businessId, filters);
  }

  public async getOrdersByUserBusinesses(userId: number) {
    const userBusinesses = await UserBusiness.findAll({
      where: {
        user_id: userId,
      },
      attributes: ['business_id'],
    });

    if (!userBusinesses.length) {
      return [];
    }

    const businessIds = Array.from(new Set(userBusinesses.map((ub) => ub.business_id)));
    const orders = await orderRepository.findByBusinessIds(businessIds);

    const grouped = businessIds.map((businessId) => ({
      business_id: businessId,
      orders: orders.filter((order) => order.business_id === businessId),
    }));

    return grouped;
  }
}

export const orderService = new OrderService();


