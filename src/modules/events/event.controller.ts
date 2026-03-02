import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { eventService } from './event.service';

export class EventController {
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

      const futureOnly = req.query.future === 'true';
      const isActive = typeof req.query.is_active === 'string' ? req.query.is_active === 'true' : undefined;

      const events = await eventService.getAllEvents(req.business_id, futureOnly, isActive);

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid event ID',
          },
        });
        return;
      }

      const event = await eventService.getEventById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: event,
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

      const {
        location_id,
        name,
        description,
        event_date,
        organizer,
        notes,
        event_type,
        expected_attendance,
        weather_condition,
        start_at,
        end_at,
        city,
        district,
        status,
        closed_at,
        is_active,
        product_ids,
        organizers,
      } = req.body;

      const event = await eventService.createEvent(
        {
          location_id,
          name,
          description,
          event_date,
          organizer,
          notes,
          event_type,
          expected_attendance,
          weather_condition,
          start_at,
          end_at,
          city,
          district,
          status,
          closed_at,
          is_active,
          product_ids,
          organizers,
        },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const eventController = new EventController();


