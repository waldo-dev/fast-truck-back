import { Transaction } from 'sequelize';
import {
  Product,
  ProductOption,
  ProductRecipe,
  ProductOptionRecipe,
  InventoryItem,
  Category,
} from '../../shared/database/models';
import { sequelize } from '../../shared/database/connection';
import { InventoryUnit } from '../../shared/database/models/enums';

type RecipeRow = {
  product_id?: number;
  product_name?: string;
  product_price?: number;
  category_name?: string;
  option_id?: number | null;
  option_value?: string | null;
  option_extra_price?: number | null;
  option_type?: string | null;
  inventory_item_id?: number;
  inventory_item_name?: string;
  inventory_unit?: string;
  cost_per_item?: number | null;
  min_stock?: number | null;
  quantity_required: number;
};

export class InventoryImportRepository {
  public async upsertRecipes(businessId: number, rows: RecipeRow[]) {
    if (!rows.length) {
      return { imported: 0, errors: ['No valid rows'] };
    }

    const errors: string[] = [];
    let imported = 0;

    await sequelize.transaction(async (t: Transaction) => {
      for (const row of rows) {
        // Resolver producto
        let productId: number | null = row.product_id ?? null;
        if (!productId && row.product_name) {
          let product = await Product.findOne({
            where: { business_id: businessId, name: row.product_name },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (!product) {
            if (!row.product_price || row.product_price <= 0) {
              errors.push(`Product "${row.product_name}" not found and product_price is required to create`);
              continue;
            }
            let categoryId: number | null = null;
            if (row.category_name) {
              let category = await Category.findOne({
                where: { business_id: businessId, name: row.category_name },
                transaction: t,
                lock: t.LOCK.UPDATE,
              });
              if (!category) {
                category = await Category.create(
                  { business_id: businessId, name: row.category_name },
                  { transaction: t }
                );
              }
              categoryId = category.id;
            }
            product = await Product.create(
              {
                business_id: businessId,
                name: row.product_name,
                price: Math.round(row.product_price),
                category_id: categoryId,
              },
              { transaction: t }
            );
          }
          productId = product.id;
        }
        if (!productId) {
          errors.push('Missing product reference');
          continue;
        }

        // Resolver opción
        let optionId: number | null = row.option_id ?? null;
        if (!optionId && row.option_value) {
          let option = await ProductOption.findOne({
            where: { product_id: productId, option_value: row.option_value },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (!option) {
            option = await ProductOption.create(
              {
                product_id: productId,
                option_value: row.option_value,
                extra_price: row.option_extra_price ?? 0,
                option_type: row.option_type ?? null,
              },
              { transaction: t }
            );
          }
          optionId = option.id;
        }

        // Resolver inventory item
        let invId: number | null = row.inventory_item_id ?? null;
        if (!invId && row.inventory_item_name) {
          let inv = await InventoryItem.findOne({
            where: { business_id: businessId, name: row.inventory_item_name },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (!inv) {
            if (!row.inventory_unit || !Object.values(InventoryUnit).includes(row.inventory_unit as InventoryUnit)) {
              errors.push(
                `Inventory item "${row.inventory_item_name}" not found and inventory_unit (GRAM|ML|UNIT) is required to create`
              );
              continue;
            }
            inv = await InventoryItem.create(
              {
                business_id: businessId,
                name: row.inventory_item_name,
                unit: row.inventory_unit as InventoryUnit,
                cost_per_item: row.cost_per_item ?? 0,
                min_stock: row.min_stock ?? 0,
                active: true,
              },
              { transaction: t }
            );
          }
          invId = inv.id;
        }
        if (!invId) {
          errors.push('Missing inventory item reference');
          continue;
        }

        if (optionId) {
          await ProductOptionRecipe.destroy({ where: { product_option_id: optionId }, transaction: t });
          await ProductOptionRecipe.create(
            {
              product_option_id: optionId,
              inventory_item_id: invId,
              quantity_required: row.quantity_required,
            },
            { transaction: t }
          );
        } else {
          await ProductRecipe.destroy({ where: { product_id: productId }, transaction: t });
          await ProductRecipe.create(
            {
              product_id: productId,
              inventory_item_id: invId,
              quantity_required: row.quantity_required,
            },
            { transaction: t }
          );
        }

        imported += 1;
      }
    });

    return { imported, errors };
  }
}

export const inventoryImportRepository = new InventoryImportRepository();


