import { Op, Transaction } from 'sequelize';
import {
  InventoryItem,
  InventoryMovement,
  ProductRecipe,
  ProductOptionRecipe,
  ProductOption,
  Product,
  InventoryLocation,
  Event,
} from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { InventoryMovementType, InventoryUnit } from '../../shared/database/models/enums';
import { sequelize } from '../../shared/database/connection';

export class InventoryRepository {
  public async listItems(businessId: number, filters?: { search?: string; active?: boolean }) {
    const where: any = { business_id: businessId };
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    if (filters?.search) {
      where.name = { [Op.iLike]: `%${filters.search}%` };
    }
    return InventoryItem.findAll({ where, order: [['name', 'ASC']] });
  }

  public async createItem(data: {
    business_id: number;
    name: string;
    unit: InventoryUnit;
    cost_per_item?: number | null;
    min_stock?: number | null;
    active?: boolean;
  }) {
    return InventoryItem.create({
      business_id: data.business_id,
      name: data.name,
      unit: data.unit,
      cost_per_item: data.cost_per_item ?? 0,
      min_stock: data.min_stock ?? 0,
      active: data.active ?? true,
    });
  }

  public async updateItem(
    id: number,
    businessId: number,
    data: { name?: string; unit?: InventoryUnit; cost_per_item?: number | null; min_stock?: number | null; active?: boolean }
  ) {
    const item = await InventoryItem.findOne({ where: { id, business_id: businessId } });
    if (!item) throw new AppError('Inventory item not found', 404);
    await item.update({
      name: data.name ?? item.name,
      unit: data.unit ?? item.unit,
      cost_per_item: data.cost_per_item ?? item.cost_per_item,
      min_stock: data.min_stock ?? item.min_stock,
      active: data.active ?? item.active,
    });
    return item;
  }

  public async listMovements(itemId: number, businessId: number) {
    const item = await InventoryItem.findOne({ where: { id: itemId, business_id: businessId } });
    if (!item) throw new AppError('Inventory item not found', 404);
    return InventoryMovement.findAll({
      where: { inventory_item_id: itemId },
      order: [['created_at', 'DESC']],
    });
  }

  public async createMovement(data: {
    business_id: number;
    inventory_item_id: number;
    quantity: number;
    movement_type: InventoryMovementType;
    reason?: string | null;
    event_id?: number | null;
    location_id?: number | null;
  }) {
    return sequelize.transaction(async (t: Transaction) => {
      const item = await InventoryItem.findOne({
        where: { id: data.inventory_item_id, business_id: data.business_id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!item) throw new AppError('Inventory item not found', 404);

      const qty = Number(data.quantity || 0);
      if (qty <= 0) {
        throw new AppError('Quantity must be greater than 0', 400);
      }

      const isIn = data.movement_type === InventoryMovementType.IN;
      const delta = isIn ? qty : -qty;

      // Si hay event_id, usar stock por evento (y ubicación si existe)
      if (data.event_id) {
        const event = await Event.findOne({ where: { id: data.event_id, business_id: data.business_id }, transaction: t });
        if (!event) {
          throw new AppError('Event not found', 404);
        }
        const eventLocationId = (event as any).location_id || data.location_id || null;

        let invLocation = await InventoryLocation.findOne({
          where: {
            inventory_item_id: data.inventory_item_id,
            event_id: data.event_id,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!invLocation) {
          invLocation = await InventoryLocation.create(
            {
              inventory_item_id: data.inventory_item_id,
              event_id: data.event_id,
              location_id: eventLocationId,
              stock: 0,
            },
            { transaction: t }
          );
        }

        const current = Number(invLocation.stock || 0);
        const newStock = current + delta;
        if (newStock < 0) {
          throw new AppError('Insufficient stock for movement in event', 400);
        }
        await invLocation.update({ stock: newStock }, { transaction: t });
      } else {
        // Stock global
        const current = Number(item.current_stock || 0);
        const newStock = current + delta;
        if (newStock < 0) {
          throw new AppError('Insufficient stock for movement', 400);
        }
        await item.update({ current_stock: newStock }, { transaction: t });
      }

      return InventoryMovement.create(
        {
          inventory_item_id: data.inventory_item_id,
          business_id: data.business_id,
          order_id: null,
          event_id: data.event_id ?? null,
          location_id: data.location_id ?? null,
          movement_type: data.movement_type,
          quantity: qty,
          reason: data.reason ?? null,
        },
        { transaction: t }
      );
    });
  }

  public async getProductRecipes(productId: number, businessId: number) {
    const product = await Product.findOne({ where: { id: productId, business_id: businessId } });
    if (!product) throw new AppError('Product not found', 404);
    return ProductRecipe.findAll({
      where: { product_id: productId },
      include: [{ model: InventoryItem, as: 'inventoryItem', attributes: ['id', 'name', 'unit', 'cost_per_item'] }],
      order: [['id', 'ASC']],
    });
  }

  public async setProductRecipes(
    productId: number,
    businessId: number,
    recipes: Array<{ inventory_item_id: number; quantity_required: number }>
  ) {
    const product = await Product.findOne({ where: { id: productId, business_id: businessId } });
    if (!product) throw new AppError('Product not found', 404);

    return sequelize.transaction(async (t: Transaction) => {
      await ProductRecipe.destroy({ where: { product_id: productId }, transaction: t });
      const rows = recipes.map((r) => ({
        product_id: productId,
        inventory_item_id: r.inventory_item_id,
        quantity_required: r.quantity_required,
      }));
      await ProductRecipe.bulkCreate(rows, { transaction: t });
    });
  }

  public async getOptionRecipes(optionId: number, businessId: number) {
    const option = await ProductOption.findOne({
      where: { id: optionId },
      include: [{ model: Product, as: 'product', attributes: ['id', 'business_id'] }],
    });
    if (!option || (option as any).product?.business_id !== businessId) {
      throw new AppError('Product option not found', 404);
    }
    return ProductOptionRecipe.findAll({
      where: { product_option_id: optionId },
      include: [{ model: InventoryItem, as: 'inventoryItem', attributes: ['id', 'name', 'unit', 'cost_per_item'] }],
      order: [['id', 'ASC']],
    });
  }

  public async setOptionRecipes(
    optionId: number,
    businessId: number,
    recipes: Array<{ inventory_item_id: number; quantity_required: number }>
  ) {
    const option = await ProductOption.findOne({
      where: { id: optionId },
      include: [{ model: Product, as: 'product', attributes: ['id', 'business_id'] }],
    });
    if (!option || (option as any).product?.business_id !== businessId) {
      throw new AppError('Product option not found', 404);
    }

    return sequelize.transaction(async (t: Transaction) => {
      await ProductOptionRecipe.destroy({ where: { product_option_id: optionId }, transaction: t });
      const rows = recipes.map((r) => ({
        product_option_id: optionId,
        inventory_item_id: r.inventory_item_id,
        quantity_required: r.quantity_required,
      }));
      await ProductOptionRecipe.bulkCreate(rows, { transaction: t });
    });
  }
}

export const inventoryRepository = new InventoryRepository();


