import { Op, Transaction } from 'sequelize';
import {
  Order,
  OrderItem,
  Product,
  ProductOption,
  Promotion,
  Customer,
  CustomerAddress,
  Event,
  Payment,
  InventoryItem,
  ProductRecipe,
  ProductOptionRecipe,
  InventoryMovement,
  InventoryLocation,
} from '../../shared/database/models';
import { sequelize } from '../../shared/database/connection';
import { AppError } from '../../shared/errors';
import {
  OrderSource,
  OrderStatus,
  OrderType,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  InventoryMovementType,
} from '../../shared/database/models/enums';

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

  /**
   * Calcula el costo (COGS) de un item usando recetas y cost_per_item
   */
  private async calculateItemCost(
    productId: number,
    quantity: number,
    selectedOptionIds: number[],
    businessId: number
  ): Promise<number> {
    // Recetas del producto
    const recipes = await ProductRecipe.findAll({
      where: { product_id: productId },
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'business_id', 'cost_per_item'],
        },
      ],
    });

    // Recetas de opciones seleccionadas
    let optionRecipes: ProductOptionRecipe[] = [];
    if (selectedOptionIds && selectedOptionIds.length > 0) {
      optionRecipes = await ProductOptionRecipe.findAll({
        where: { product_option_id: { [Op.in]: selectedOptionIds } },
        include: [
          {
            model: InventoryItem,
            as: 'inventoryItem',
            attributes: ['id', 'business_id', 'cost_per_item'],
          },
        ],
      });
    }

    let totalCost = 0;

    const addCost = (costPerItem: number | null | undefined, qtyRequired: number) => {
      const c = Number(costPerItem ?? 0);
      totalCost += c * qtyRequired;
    };

    // Producto base
    for (const r of recipes) {
      const inv = (r as any).inventoryItem as InventoryItem | undefined;
      if (!inv) continue;
      // Validar pertenencia al negocio
      if (inv.business_id && inv.business_id !== businessId) continue;
      addCost(inv.cost_per_item, Number(r.quantity_required || 0) * quantity);
    }

    // Opciones
    for (const r of optionRecipes) {
      const inv = (r as any).inventoryItem as InventoryItem | undefined;
      if (!inv) continue;
      if (inv.business_id && inv.business_id !== businessId) continue;
      addCost(inv.cost_per_item, Number(r.quantity_required || 0) * quantity);
    }

    return totalCost;
  }

  /**
   * Calcula el consumo de inventario para un item (producto + opciones)
   */
  private async calculateItemConsumption(
    productId: number,
    quantity: number,
    selectedOptionIds: number[],
    businessId: number
  ): Promise<Array<{ inventory_item_id: number; quantity: number }>> {
    const recipes = await ProductRecipe.findAll({
      where: { product_id: productId },
      include: [
        {
          model: InventoryItem,
          as: 'inventoryItem',
          attributes: ['id', 'business_id'],
        },
      ],
    });

    let optionRecipes: ProductOptionRecipe[] = [];
    if (selectedOptionIds && selectedOptionIds.length > 0) {
      optionRecipes = await ProductOptionRecipe.findAll({
        where: { product_option_id: { [Op.in]: selectedOptionIds } },
        include: [
          {
            model: InventoryItem,
            as: 'inventoryItem',
            attributes: ['id', 'business_id'],
          },
        ],
      });
    }

    const consumptions: Array<{ inventory_item_id: number; quantity: number }> = [];

    const pushConsumption = (invId: number, qty: number) => {
      if (!invId) return;
      const existing = consumptions.find((c) => c.inventory_item_id === invId);
      if (existing) {
        existing.quantity += qty;
      } else {
        consumptions.push({ inventory_item_id: invId, quantity: qty });
      }
    };

    for (const r of recipes) {
      const inv = (r as any).inventoryItem as InventoryItem | undefined;
      if (!inv) continue;
      if (inv.business_id && inv.business_id !== businessId) continue;
      pushConsumption(inv.id, Number(r.quantity_required || 0) * quantity);
    }

    for (const r of optionRecipes) {
      const inv = (r as any).inventoryItem as InventoryItem | undefined;
      if (!inv) continue;
      if (inv.business_id && inv.business_id !== businessId) continue;
      pushConsumption(inv.id, Number(r.quantity_required || 0) * quantity);
    }

    return consumptions;
  }

  public async findAll(
    businessId: number,
    filters?: { status?: OrderStatus; order_source?: OrderSource; customer_id?: number; event_id?: number }
  ) {
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

    if (filters?.event_id) {
      where.event_id = filters.event_id;
    } else {
      // Por defecto no devolver órdenes asociadas a eventos
      where.event_id = null;
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

  public async findByBusinessIds(businessIds: number[]) {
    if (!businessIds || businessIds.length === 0) {
      return [];
    }

    const orders = await Order.findAll({
      where: {
        business_id: {
          [Op.in]: businessIds,
        },
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
      order: [
        ['business_id', 'ASC'],
        ['created_at', 'DESC'],
      ],
    });

    return orders;
  }

  public async findHistory(
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
    const where: any = {
      business_id: businessId,
    };

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at[Op.lte] = filters.endDate;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.order_source) {
      where.order_source = filters.order_source;
    }

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters.event_id) {
      where.event_id = filters.event_id;
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

  public async findCloseout(
    businessId: number,
    filters: {
      startDate?: Date;
      endDate?: Date;
      vatRate?: number;
    }
  ) {
    const where: any = {
      business_id: businessId,
    };

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at[Op.lte] = filters.endDate;
      }
    }

    const orders = await Order.findAll({
      where,
      attributes: ['id', 'total', 'status', 'payment_type', 'created_at'],
      include: [
        {
          model: Payment,
          as: 'payments',
          attributes: ['payment_method', 'payment_status', 'amount'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    let grossSales = 0;
    let netSales = 0;
    let taxes = 0;
    let cancelledSales = 0;
    let cancelledCount = 0;
    let receiptCount = 0;
    let discounts = 0; // No se almacenan descuentos explícitos; queda en 0

    const paymentBreakdown: Record<string, number> = {
      CASH: 0,
      CARD: 0,
      DEBIT_CARD: 0,
      CREDIT_CARD: 0,
      TRANSFER: 0,
      WEBPAY: 0,
      OTHER: 0,
    };

    const vatRate = filters.vatRate ?? 0.19;

    for (const order of orders) {
      const isCancelled = order.status === OrderStatus.CANCELLED;
      if (isCancelled) {
        cancelledSales += order.total;
        cancelledCount += 1;
        continue;
      }

      grossSales += order.total;
      receiptCount += 1;

      const payments = (order as any).payments as Array<Payment>;
      if (payments && payments.length > 0) {
        for (const payment of payments) {
          if (payment.payment_status === PaymentStatus.FAILED) continue;
          const method = payment.payment_method || 'OTHER';
          paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (payment.amount || 0);
        }
      } else if (order.payment_type) {
        const method = order.payment_type || 'OTHER';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + order.total;
      }
    }

    netSales = vatRate > 0 ? grossSales / (1 + vatRate) : grossSales;
    taxes = grossSales - netSales;

    return {
      gross_sales: grossSales,
      net_sales: netSales,
      taxes,
      vat_rate: vatRate,
      receipt_count: receiptCount,
      cancelled_sales: cancelledSales,
      cancelled_count: cancelledCount,
      discounts_applied: discounts,
      payment_breakdown: paymentBreakdown,
    };
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
  }) {
    return sequelize.transaction(async (t: Transaction) => {
      // Validar customer
      const customer = await Customer.findOne({
        where: {
          id: data.customer_id,
          business_id: data.business_id,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
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
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!address) {
          throw new AppError('Address not found or does not belong to customer', 400);
        }
      }

      // Validar event si se proporciona
      let eventRecord: Event | null = null;
      if (data.event_id) {
        eventRecord = await Event.findOne({
          where: {
            id: data.event_id,
            business_id: data.business_id,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!eventRecord) {
          throw new AppError('Event not found', 400);
        }
      }

      // Calcular total, costos y consumos
      let total = 0;
      const orderItems: Array<{
        product_id: number;
        quantity: number;
        unit_price: number;
        cost: number;
        notes?: string | null;
      }> = [];
      const consumptionAggregated: Record<number, number> = {};

      for (const item of data.items) {
        const itemTotal = await this.calculateItemPrice(
          item.product_id,
          item.quantity,
          item.selected_option_ids || [],
          data.business_id
        );

        // Obtener precio unitario (sin promociones para guardar en order_item)
        const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
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
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          const optionsExtraPrice = selectedOptions.reduce((sum, option) => sum + (option.extra_price || 0), 0);
          unitPrice += optionsExtraPrice;
        }

        const itemCost = await this.calculateItemCost(
          item.product_id,
          item.quantity,
          item.selected_option_ids || [],
          data.business_id
        );

        const consumptions = await this.calculateItemConsumption(
          item.product_id,
          item.quantity,
          item.selected_option_ids || [],
          data.business_id
        );
        for (const c of consumptions) {
          consumptionAggregated[c.inventory_item_id] =
            (consumptionAggregated[c.inventory_item_id] || 0) + Number(c.quantity || 0);
        }

        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          cost: itemCost,
          notes: item.notes || null,
        });

        total += itemTotal;
      }

      // Crear orden
      const order = await Order.create(
        {
          business_id: data.business_id,
          customer_id: data.customer_id,
          address_id: data.address_id || null,
          event_id: data.event_id || null,
          payment_type: data.payment_method || null,
          order_source: data.order_source,
          order_type: data.order_type,
          status: data.status || OrderStatus.CREATED,
          total,
        },
        { transaction: t }
      );

      // Crear payment si se envía método
      if (data.payment_method) {
        await Payment.create(
          {
            order_id: order.id,
            payment_method: data.payment_method,
            payment_status: PaymentStatus.PENDING,
            amount: total,
          },
          { transaction: t }
        );
      }

      // Crear items
      await OrderItem.bulkCreate(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item,
        })),
        { transaction: t }
      );

      // Descontar inventario y registrar movimientos
      for (const [invIdStr, qty] of Object.entries(consumptionAggregated)) {
        const invId = Number(invIdStr);
        const quantityToConsume = Number(qty || 0);
        if (quantityToConsume <= 0) continue;

        const inventoryItem = await InventoryItem.findOne({
          where: { id: invId, business_id: data.business_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!inventoryItem) {
          throw new AppError(`Inventory item ${invId} not found`, 400);
        }

        if (eventRecord) {
          // Consumir desde stock por evento (y ubicación del evento si existe)
          const eventLocationId = (eventRecord as any).location_id || null;
          let invLocation = await InventoryLocation.findOne({
            where: {
              inventory_item_id: invId,
              event_id: eventRecord.id,
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!invLocation) {
            invLocation = await InventoryLocation.create(
              {
                inventory_item_id: invId,
                event_id: eventRecord.id,
                location_id: eventLocationId,
                stock: 0,
              },
              { transaction: t }
            );
          }

          const currentStock = Number(invLocation.stock || 0);
          const newStock = currentStock - quantityToConsume;
          if (newStock < 0) {
            throw new AppError(`Insufficient stock for inventory item ${invId} in event`, 400);
          }

          await invLocation.update({ stock: newStock }, { transaction: t });
        } else {
          // Consumir stock global
          const currentStock = Number(inventoryItem.current_stock || 0);
          const newStock = currentStock - quantityToConsume;
          if (newStock < 0) {
            throw new AppError(`Insufficient stock for inventory item ${invId}`, 400);
          }
          await inventoryItem.update({ current_stock: newStock }, { transaction: t });
        }

        await InventoryMovement.create(
          {
            inventory_item_id: invId,
            business_id: data.business_id,
            order_id: order.id,
            event_id: data.event_id || null,
            location_id: (eventRecord as any)?.location_id || null,
            movement_type: InventoryMovementType.OUT,
            quantity: quantityToConsume,
            reason: 'ORDER_CONSUMPTION',
          },
          { transaction: t }
        );
      }

      return this.findById(order.id, data.business_id);
    });
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

