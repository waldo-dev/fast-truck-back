import { Op } from 'sequelize';
import { Order, OrderItem, Product, ProductOption, Promotion, Customer, CustomerAddress, Event } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { OrderSource, OrderStatus, OrderType, DiscountType } from '../../shared/database/models/enums';

export class OrderRepository {
  /**
   * Calcula el precio total de un item considerando opciones y promociones
   */
  private async calculateItemPrice(
    productId: number,
    quantity: number,
    selectedOptionIds: number[],
    businessId: number
  ): Promise<number> {
    const product = await Product.findOne({
      where: {
        id: productId,
        business_id: businessId,
        status: 'ACTIVE',
      },
      include: [
        {
          model: ProductOption,
          as: 'options',
        },
      ],
    });

    if (!product) {
      throw new AppError(`Product ${productId} not found or inactive`, 400);
    }

    let itemPrice = product.price;

    // Sumar precios de opciones seleccionadas
    if (selectedOptionIds && selectedOptionIds.length > 0) {
      const selectedOptions = await ProductOption.findAll({
        where: {
          id: { [Op.in]: selectedOptionIds },
          product_id: productId,
        },
      });

      if (selectedOptions.length !== selectedOptionIds.length) {
        throw new AppError('Some selected options are invalid', 400);
      }

      const optionsExtraPrice = selectedOptions.reduce((sum, option) => sum + (option.extra_price || 0), 0);
      itemPrice += optionsExtraPrice;
    }

    // Buscar promociones activas para este producto
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activePromotions = await Promotion.findAll({
      where: {
        business_id: businessId,
        active: true,
        [Op.and]: [
          { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }] },
          { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
        ],
      },
      include: [
        {
          model: Product,
          as: 'products',
          where: { id: productId },
          through: { attributes: [] },
        },
      ],
    });

    // Aplicar descuento de promoción si existe
    if (activePromotions.length > 0) {
      // Tomar la primera promoción activa (en el futuro se podría priorizar)
      const promotion = activePromotions[0];

      if (promotion.discount_type === DiscountType.FIXED) {
        itemPrice = Math.max(0, itemPrice - (promotion.discount_value || 0));
      } else if (promotion.discount_type === DiscountType.PERCENTAGE) {
        const discount = Math.floor((itemPrice * (promotion.discount_value || 0)) / 100);
        itemPrice = Math.max(0, itemPrice - discount);
      }
    }

    return itemPrice * quantity;
  }

  public async findAll(businessId: number, filters?: { status?: OrderStatus; order_source?: OrderSource; customer_id?: number }) {
    const where: any = {
      business_id: businessId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.order_source) {
      where.order_source = filters.order_source;
    }

    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: CustomerAddress,
          as: 'address',
          attributes: ['id', 'address'],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'event_date'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return orders;
  }

  public async findById(id: number, businessId: number) {
    const order = await Order.findOne({
      where: {
        id,
        business_id: businessId,
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
        },
        {
          model: CustomerAddress,
          as: 'address',
          attributes: ['id', 'address'],
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'event_date'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price', 'image_url'],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  public async create(data: {
    business_id: number;
    customer_id: number;
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
  }) {
    // Validar customer
    const customer = await Customer.findOne({
      where: {
        id: data.customer_id,
        business_id: data.business_id,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 400);
    }

    // Validar address si es DELIVERY
    if (data.order_type === OrderType.DELIVERY && data.address_id) {
      const address = await CustomerAddress.findOne({
        where: {
          id: data.address_id,
          customer_id: data.customer_id,
        },
      });

      if (!address) {
        throw new AppError('Address not found or does not belong to customer', 400);
      }
    }

    // Validar event si se proporciona
    if (data.event_id) {
      const event = await Event.findOne({
        where: {
          id: data.event_id,
          business_id: data.business_id,
        },
      });

      if (!event) {
        throw new AppError('Event not found', 400);
      }
    }

    // Calcular total
    let total = 0;
    const orderItems: Array<{
      product_id: number;
      quantity: number;
      unit_price: number;
      notes?: string | null;
    }> = [];

    for (const item of data.items) {
      const itemTotal = await this.calculateItemPrice(
        item.product_id,
        item.quantity,
        item.selected_option_ids || [],
        data.business_id
      );

      // Obtener precio unitario (sin promociones para guardar en order_item)
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        throw new AppError(`Product ${item.product_id} not found`, 400);
      }

      let unitPrice = product.price;
      if (item.selected_option_ids && item.selected_option_ids.length > 0) {
        const selectedOptions = await ProductOption.findAll({
          where: {
            id: { [Op.in]: item.selected_option_ids },
            product_id: item.product_id,
          },
        });
        const optionsExtraPrice = selectedOptions.reduce((sum, option) => sum + (option.extra_price || 0), 0);
        unitPrice += optionsExtraPrice;
      }

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        notes: item.notes || null,
      });

      total += itemTotal;
    }

    // Crear orden
    const order = await Order.create({
      business_id: data.business_id,
      customer_id: data.customer_id,
      address_id: data.address_id || null,
      event_id: data.event_id || null,
      order_source: data.order_source,
      order_type: data.order_type,
      status: data.status || OrderStatus.CREATED,
      total,
    });

    // Crear items
    await OrderItem.bulkCreate(
      orderItems.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    );

    return this.findById(order.id, data.business_id);
  }

  public async updateStatus(id: number, businessId: number, status: OrderStatus) {
    const order = await this.findById(id, businessId);

    // Validar transición de estado
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const currentStatus = order.status;
    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${status}`,
        400
      );
    }

    await order.update({ status });
    return order.reload();
  }

  public async delete(id: number, businessId: number) {
    const order = await this.findById(id, businessId);

    // Solo se pueden eliminar órdenes en estado CREATED o CANCELLED
    if (order.status !== OrderStatus.CREATED && order.status !== OrderStatus.CANCELLED) {
      throw new AppError('Cannot delete order in current status', 400);
    }

    await order.destroy();
  }
}

export const orderRepository = new OrderRepository();

