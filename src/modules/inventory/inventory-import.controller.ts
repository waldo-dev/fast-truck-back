import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { inventoryImportService } from './inventory-import.service';

export class InventoryImportController {
  public importRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      if (!req.file) {
        res.status(400).json({ success: false, error: { message: 'File is required' } });
        return;
      }
      const report = await inventoryImportService.importRecipes(req.business_id, req.file.buffer);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryImportController = new InventoryImportController();











