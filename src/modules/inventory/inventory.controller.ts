import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { inventoryService } from './inventory.service';

export class InventoryController {
  public listItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const { search, active } = req.query as any;
      const items = await inventoryService.listItems(req.business_id, { search, active });
      res.status(200).json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  };

  public createItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const item = await inventoryService.createItem({ business_id: req.business_id, ...req.body });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  public updateItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const id = parseInt(req.params.id, 10);
      const item = await inventoryService.updateItem(id, req.business_id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  public listMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const itemId = parseInt(req.params.itemId, 10);
      const movements = await inventoryService.listMovements(itemId, req.business_id);
      res.status(200).json({ success: true, data: movements });
    } catch (error) {
      next(error);
    }
  };

  public createMovement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const movement = await inventoryService.createMovement({
        business_id: req.business_id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      next(error);
    }
  };

  public getProductRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const productId = parseInt(req.params.id, 10);
      const recipes = await inventoryService.getProductRecipes(productId, req.business_id);
      res.status(200).json({ success: true, data: recipes });
    } catch (error) {
      next(error);
    }
  };

  public setProductRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const productId = parseInt(req.params.id, 10);
      await inventoryService.setProductRecipes(productId, req.business_id, req.body.recipes);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public getOptionRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const optionId = parseInt(req.params.optionId, 10);
      const recipes = await inventoryService.getOptionRecipes(optionId, req.business_id);
      res.status(200).json({ success: true, data: recipes });
    } catch (error) {
      next(error);
    }
  };

  public setOptionRecipes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({ success: false, error: { message: 'Business ID is required' } });
        return;
      }
      const optionId = parseInt(req.params.optionId, 10);
      await inventoryService.setOptionRecipes(optionId, req.business_id, req.body.recipes);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();



