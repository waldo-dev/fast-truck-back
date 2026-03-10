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
        address,
        location_name,
      } = req.body;

      const event = await eventService.createEvent(
        {
          location_id,
          name,
          description,
          event_date,
          organizer: organizer?.name,
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
          address,
          location_name,
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

  public getSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      const id = req.user?.id
      if (!id) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' },
        });
        return;
      }

      const summary = await eventService.getSummary(id, req.business_id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const analytics = await eventService.getAnalytics(req.business_id, limit);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };

  public createExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      const eventId = parseInt(req.params.id, 10);
      const { type, description, amount } = req.body;

      const expense = await eventService.addExpense(eventId, req.business_id, { type, description, amount });

      res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  };

  public listExpenses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      const eventId = req.user?.id
      if (!eventId) {
        res.status(400).json({
          success: false,
          error: { message: 'Event ID is required' },
        });
        return;
      }
      const expenses = await eventService.listExpenses(eventId, req.business_id);
      if (!expenses) {
        res.status(400).json({
          success: false,
          error: { message: 'Expenses not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      const eventId = parseInt(req.params.id, 10);
      const expenseId = parseInt(req.params.expenseId, 10);

      await eventService.deleteExpense(eventId, expenseId, req.business_id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const eventController = new EventController();


