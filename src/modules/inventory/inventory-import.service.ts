import ExcelJS from 'exceljs';
import { inventoryImportRepository } from './inventory-import.repository';

type ImportRow = {
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

export class InventoryImportService {
  public async importRecipes(businessId: number, fileBuffer: Buffer | ArrayBuffer | Uint8Array) {
    const workbook = new ExcelJS.Workbook();
    const arrayBuf: ArrayBuffer = Buffer.isBuffer(fileBuffer)
      ? fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      : fileBuffer instanceof Uint8Array
      ? fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
      : (fileBuffer as ArrayBuffer);
    await workbook.xlsx.load(arrayBuf);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new Error('Empty workbook');
    }

    // Columnas aceptadas:
    // - product_id o product_name (requerido uno)
    // - product_price (obligatorio si product no existe)
    // - category_name (opcional, para crear o vincular categoría)
    // - option_id o option_value (opcional)
    // - option_extra_price (opcional para crear opción)
    // - inventory_item_id o inventory_item_name (requerido uno)
    // - inventory_unit (GRAM|ML|UNIT) obligatorio si el ítem no existe
    // - cost_per_item, min_stock (opcionales para crear ítem)
    // - quantity_required (requerido)
    const headerMap: Record<string, number> = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
      const key = String(cell.value || '').trim().toLowerCase();
      if (key) headerMap[key] = colNumber;
    });

    if (!headerMap['quantity_required']) throw new Error('Missing column: quantity_required');
    if (!headerMap['product_id'] && !headerMap['product_name']) throw new Error('Missing product_id or product_name');
    if (!headerMap['inventory_item_id'] && !headerMap['inventory_item_name'])
      throw new Error('Missing inventory_item_id or inventory_item_name');

    const rowsData: ImportRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const get = (key: string) => {
        const col = headerMap[key];
        if (!col || col < 1) return null;
        return row.getCell(col).value;
      };
      const productId = Number(get('product_id')) || null;
      const productNameRaw = get('product_name');
      const product_name = productNameRaw ? String(productNameRaw).trim() : null;
      const product_price = get('product_price') ? Number(get('product_price')) : null;
      const categoryRaw = get('category_name');
      const category_name = categoryRaw ? String(categoryRaw).trim() : null;

      const optionIdRaw = get('option_id');
      const optionId = optionIdRaw === null || optionIdRaw === undefined || optionIdRaw === '' ? null : Number(optionIdRaw);
      const optionValueRaw = get('option_value');
      const option_value = optionValueRaw ? String(optionValueRaw).trim() : null;
      const option_extra_price = get('option_extra_price') ? Number(get('option_extra_price')) : null;
      const option_type = get('option_type') ? String(get('option_type')).trim() : null;

      const invId = Number(get('inventory_item_id')) || null;
      const invNameRaw = get('inventory_item_name');
      const inventory_item_name = invNameRaw ? String(invNameRaw).trim() : null;
      const inventory_unit = get('inventory_unit') ? String(get('inventory_unit')).trim() : null;
      const cost_per_item = get('cost_per_item') ? Number(get('cost_per_item')) : null;
      const min_stock = get('min_stock') ? Number(get('min_stock')) : null;

      const qty = Number(get('quantity_required'));
      if ((!productId && !product_name) || (!invId && !inventory_item_name) || !qty || qty <= 0) return;
      rowsData.push({
        product_id: productId || undefined,
        product_name: product_name || undefined,
        product_price: product_price ?? undefined,
        category_name: category_name || undefined,
        option_id: optionId || undefined,
        option_value: option_value || undefined,
        option_extra_price: option_extra_price ?? undefined,
        option_type: option_type || undefined,
        inventory_item_id: invId || undefined,
        inventory_item_name: inventory_item_name || undefined,
        inventory_unit: inventory_unit || undefined,
        cost_per_item: cost_per_item ?? undefined,
        min_stock: min_stock ?? undefined,
        quantity_required: qty,
      });
    });

    return inventoryImportRepository.upsertRecipes(businessId, rowsData);
  }
}

export const inventoryImportService = new InventoryImportService();


