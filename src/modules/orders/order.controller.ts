import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole, OrderStatus, OrderSource } from '../../shared/database/models/enums';
import { orderService } from './order.service';

export class OrderController {
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

      const status = req.query.status as OrderStatus | undefined;
      const order_source = req.query.order_source as OrderSource | undefined;
      const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;

      const filters: { status?: OrderStatus; order_source?: OrderSource; customer_id?: number } = {};
      if (status && Object.values(OrderStatus).includes(status)) {
        filters.status = status;
      }
      if (order_source && Object.values(OrderSource).includes(order_source)) {
        filters.order_source = order_source;
      }
      if (customer_id && !isNaN(customer_id)) {
        filters.customer_id = customer_id;
      }

      const orders = await orderService.getAllOrders(req.business_id, filters);

      res.status(200).json({
        success: true,
        data: orders,
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
            message: 'Invalid order ID',
          },
        });
        return;
      }

      const order = await orderService.getOrderById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: order,
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

      const { customer_id, address_id, event_id, order_source, order_type, status, items } = req.body;

      const order = await orderService.createOrder(
        {
          customer_id,
          address_id,
          event_id,
          order_source,
          order_type,
          status,
          items,
        },
        req.business_id,
        req.user.role as UserRole
      );

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid order ID',
          },
        });
        return;
      }

      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status',
          },
        });
        return;
      }

      const order = await orderService.updateOrderStatus(id, req.business_id, status, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid order ID',
          },
        });
        return;
      }

      await orderService.deleteOrder(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();


