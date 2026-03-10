import { InventoryMovementType, InventoryUnit } from '../../shared/database/models/enums';
import { inventoryRepository } from './inventory.repository';

export class InventoryService {
  listItems(businessId: number, filters?: { search?: string; active?: boolean }) {
    return inventoryRepository.listItems(businessId, filters);
  }

  createItem(data: {
    business_id: number;
    name: string;
    unit: InventoryUnit;
    cost_per_item?: number | null;
    min_stock?: number | null;
    active?: boolean;
  }) {
    return inventoryRepository.createItem(data);
  }

  updateItem(
    id: number,
    businessId: number,
    data: {
      name?: string;
      unit?: InventoryUnit;
      cost_per_item?: number | null;
      min_stock?: number | null;
      active?: boolean;
    }
  ) {
    return inventoryRepository.updateItem(id, businessId, data);
  }

  listMovements(itemId: number, businessId: number) {
    return inventoryRepository.listMovements(itemId, businessId);
  }

  createMovement(data: {
    business_id: number;
    inventory_item_id: number;
    quantity: number;
    movement_type: InventoryMovementType;
    reason?: string | null;
    event_id?: number | null;
    location_id?: number | null;
  }) {
    return inventoryRepository.createMovement(data);
  }

  getProductRecipes(productId: number, businessId: number) {
    return inventoryRepository.getProductRecipes(productId, businessId);
  }

  setProductRecipes(
    productId: number,
    businessId: number,
    recipes: Array<{ inventory_item_id: number; quantity_required: number }>
  ) {
    return inventoryRepository.setProductRecipes(productId, businessId, recipes);
  }

  getOptionRecipes(optionId: number, businessId: number) {
    return inventoryRepository.getOptionRecipes(optionId, businessId);
  }

  setOptionRecipes(
    optionId: number,
    businessId: number,
    recipes: Array<{ inventory_item_id: number; quantity_required: number }>
  ) {
    return inventoryRepository.setOptionRecipes(optionId, businessId, recipes);
  }
}

export const inventoryService = new InventoryService();


