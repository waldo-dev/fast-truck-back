import { AppError } from '../../shared/errors';
import { UserRole, OrderSource, OrderStatus, OrderType } from '../../shared/database/models/enums';
import { orderRepository } from './order.repository';
import { customerRepository } from '../customers/customer.repository';

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
      customer_id?: number;
      customer?: {
        name: string;
        phone: string;
        notes?: string | null;
        address?: {
          address: string;
          notes?: string | null;
          is_default?: boolean;
        };
      };
      address_id?: number | null;
      event_id?: number | null;
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
    businessId: number,
    userRole: UserRole
  ) {
    // Validar permisos: LOCAL_OPERATOR solo puede crear pedidos WHATSAPP
    if (userRole === UserRole.LOCAL_OPERATOR && data.order_source !== OrderSource.WHATSAPP) {
      throw new AppError('LOCAL_OPERATOR can only create WHATSAPP orders', 403);
    }

    // Obtener o crear customer
    let customerId = data.customer_id ?? null;
    if (!customerId && !data.customer) {
      throw new AppError('Customer information is required', 400);
    }

    if (customerId) {
      // Valida pertenencia al negocio
      await customerRepository.findById(customerId, businessId);
    } else if (data.customer) {
      const existingCustomer = await customerRepository.findByPhone(data.customer.phone, businessId);
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await customerRepository.create({
          business_id: businessId,
          name: data.customer.name,
          phone: data.customer.phone,
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
      business_id: businessId,
      customer_id: customerId,
      address_id: addressId,
      event_id: data.event_id,
      order_source: data.order_source,
      order_type: data.order_type,
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


