import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { locationService } from './location.service';

export class LocationController {
  public getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const locations = await locationService.getAllLocations(req.business_id);

      res.status(200).json({
        success: true,
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      console.log('POST /locations payload:', req.body);

      const { name, address, is_main } = req.body;

      const location = await locationService.createLocation(
        {
          name,
          address,
          is_main,
        },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const locationController = new LocationController();


