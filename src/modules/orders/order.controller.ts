import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole, OrderStatus, OrderSource } from '../../shared/database/models/enums';
import { orderService } from './order.service';

export class OrderController {
  public getByUserBusinesses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is required',
          },
        });
        return;
      }

      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const isSelf = req.user.id === userId;
      const isAdminOrOwner = [UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(req.user.role as UserRole);

      if (!isSelf && !isAdminOrOwner) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to view orders for this user',
          },
        });
        return;
      }

      const ordersByBusiness = await orderService.getOrdersByUserBusinesses(userId);

      res.status(200).json({
        success: true,
        data: ordersByBusiness,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByUserBusinessesCsv = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is required',
          },
        });
        return;
      }

      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const isSelf = req.user.id === userId;
      const isAdminOrOwner = [UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(req.user.role as UserRole);

      if (!isSelf && !isAdminOrOwner) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to view orders for this user',
          },
        });
        return;
      }

      const ordersByBusiness = await orderService.getOrdersByUserBusinesses(userId);

      const rows = ordersByBusiness.flatMap((group) =>
        group.orders.map((order: any) => ({
          business_id: group.business_id,
          order_id: order.id,
          customer_id: order.customer_id ?? '',
          customer_name: order.customer?.name ?? '',
          customer_phone: order.customer?.phone ?? '',
          address: order.address?.address ?? '',
          event_id: order.event?.id ?? '',
          event_name: order.event?.name ?? '',
          order_source: order.order_source,
          order_type: order.order_type,
          status: order.status,
          total: order.total,
          created_at: order.created_at,
        }))
      );

      const headers = [
        'business_id',
        'order_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'address',
        'event_id',
        'event_name',
        'order_source',
        'order_type',
        'status',
        'total',
        'created_at',
      ];

      const escapeCsv = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes('"') || stringValue.includes(';') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvLines = [
        headers.join(';'),
        ...rows.map((row) => headers.map((h) => escapeCsv((row as any)[h])).join(';')),
      ];

      const csv = csvLines.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders_user_${userId}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };

  public getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const allowedRoles = [UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR];
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to view order history',
          },
        });
        return;
      }

      const { start_date, end_date, status, order_source, customer_id, business_id } = req.query as {
        start_date?: string;
        end_date?: string;
        status?: OrderStatus;
        order_source?: OrderSource;
        customer_id?: string;
        business_id?: string;
      };

      const parseBoundary = (value?: string, isStart?: boolean): Date | undefined => {
        if (!value) return undefined;
        const date = new Date(value);
        if (isNaN(date.getTime())) return undefined;
        if (value.length === 10) {
          // YYYY-MM-DD => ajustar a inicio/fin de día en hora local
          if (isStart) {
            date.setHours(0, 0, 0, 0);
          } else {
            date.setHours(23, 59, 59, 999);
          }
        }
        return date;
      };

      const filters: {
        startDate?: Date;
        endDate?: Date;
        status?: OrderStatus;
        order_source?: OrderSource;
        customer_id?: number;
      } = {};

      const parsedStart = parseBoundary(start_date, true);
      const parsedEnd = parseBoundary(end_date, false);

      if (parsedStart) {
        filters.startDate = parsedStart;
      }
      if (parsedEnd) {
        filters.endDate = parsedEnd;
      }
      if (status && Object.values(OrderStatus).includes(status)) {
        filters.status = status;
      }
      if (order_source && Object.values(OrderSource).includes(order_source)) {
        filters.order_source = order_source;
      }
      if (customer_id && !isNaN(parseInt(customer_id, 10))) {
        filters.customer_id = parseInt(customer_id, 10);
      }

      const requestedBusinessId = business_id ? parseInt(business_id, 10) : undefined;
      const businessId = requestedBusinessId ?? req.business_id;

      if (!businessId || isNaN(businessId)) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const orders = await orderService.getHistory(businessId, filters);
      const ordersWithFlag = orders.map((order: any) => {
        const plain = typeof order.toJSON === 'function' ? order.toJSON() : order;
        return {
          ...plain,
          has_event: Boolean(plain.event_id),
        };
      });

      res.status(200).json({
        success: true,
        data: ordersWithFlag,
      });
    } catch (error) {
      next(error);
    }
  };

  public getCloseout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      const allowedRoles = [UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR];
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to view closeout',
          },
        });
        return;
      }

      const { start_date, end_date, vat_rate } = req.query as {
        start_date?: string;
        end_date?: string;
        vat_rate?: string | number;
      };

      const parseBoundary = (value?: string, isStart?: boolean): Date | undefined => {
        if (!value) return undefined;
        const date = new Date(value);
        if (isNaN(date.getTime())) return undefined;
        if (value.length === 10) {
          if (isStart) {
            date.setHours(0, 0, 0, 0);
          } else {
            date.setHours(23, 59, 59, 999);
          }
        }
        return date;
      };

      const filters: {
        startDate?: Date;
        endDate?: Date;
        vatRate?: number;
      } = {};

      const parsedStart = parseBoundary(start_date, true);
      const parsedEnd = parseBoundary(end_date, false);

      if (parsedStart) {
        filters.startDate = parsedStart;
      }
      if (parsedEnd) {
        filters.endDate = parsedEnd;
      }
      if (vat_rate !== undefined) {
        const rate = typeof vat_rate === 'string' ? parseFloat(vat_rate) : vat_rate;
        if (!isNaN(rate)) {
          filters.vatRate = rate;
        }
      }

      const summary = await orderService.getCloseout(req.business_id, filters);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

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

      const { customer_id, customer, address_id, event_id, payment_method, order_source, order_type, status, items } = req.body;

      const order = await orderService.createOrder(
        {
          customer_id,
          customer,
          address_id,
          event_id,
          payment_method,
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


