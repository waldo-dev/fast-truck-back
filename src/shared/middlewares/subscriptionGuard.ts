import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Plan, Subscription, Event, Product, User, Location } from '../database/models';
import { SubscriptionStatus } from '../database/models/enums';

const DEMO_BUSINESS_ID = 999;

type GuardedResource = 'events' | 'products' | 'users' | 'locations' | 'inventory';

const getLimitField = (plan: Plan, resource: GuardedResource): number | null | undefined => {
  switch (resource) {
    case 'events':
      return (plan as any).max_events;
    case 'products':
      return (plan as any).max_products;
    case 'users':
      return (plan as any).max_users;
    case 'locations':
      return (plan as any).max_locations;
    case 'inventory':
      // sin límite de plan para inventario
      return undefined;
    default:
      return undefined;
  }
};

const getCountForResource = async (businessId: number, resource: GuardedResource): Promise<number> => {
  switch (resource) {
    case 'events':
      return Event.count({ where: { business_id: businessId } });
    case 'products':
      return Product.count({ where: { business_id: businessId } });
    case 'users':
      return User.count({ where: { business_id: businessId } });
    case 'locations':
      return Location.count({ where: { business_id: businessId } });
    case 'inventory':
      return 0;
  }
};

export const demoReadOnlyGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.business_id === DEMO_BUSINESS_ID && req.method !== 'GET') {
    res.status(403).json({
      success: false,
      error: { message: 'Cuenta demo en modo solo lectura' },
    });
    return;
  }
  next();
};

export const subscriptionGuard =
  (resource: GuardedResource) => async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessIdParam = req.query?.business_id ? Number(req.query.business_id) : req.business_id;
      if (!businessIdParam || Number.isNaN(businessIdParam)) {
        res.status(403).json({
          success: false,
          error: { message: 'Business ID is required' },
        });
        return;
      }

      // Permitir demo solo lectura (la escritura ya fue bloqueada arriba)
      const subscription = await Subscription.findOne({
        where: { business_id: businessIdParam },
        include: [{ model: Plan, as: 'plan' }],
      });

      if (!subscription) {
        res.status(402).json({
          success: false,
          error: { message: 'Suscripción no encontrada para este negocio' },
        });
        return;
      }

      // Expirar trial si corresponde
      const now = new Date();
      if (
        subscription.status === SubscriptionStatus.TRIAL &&
        subscription.trial_ends_at &&
        subscription.trial_ends_at.getTime() < now.getTime()
      ) {
        await subscription.update({ status: SubscriptionStatus.EXPIRED });
      }

      if (
        subscription.status === SubscriptionStatus.EXPIRED ||
        subscription.status === SubscriptionStatus.CANCELLED
      ) {
        res.status(402).json({
          success: false,
          error: { message: 'La suscripción no está activa' },
        });
        return;
      }

      const plan = subscription.get('plan') as Plan | undefined;
      if (!plan) {
        res.status(402).json({
          success: false,
          error: { message: 'Plan no asociado a la suscripción' },
        });
        return;
      }

      const limit = getLimitField(plan, resource);
      if (limit === null || limit === undefined) {
        next();
        return;
      }

      const currentCount = await getCountForResource(businessIdParam, resource);
      if (currentCount >= limit) {
        res.status(402).json({
          success: false,
          error: { message: `Límite de ${resource} alcanzado para el plan` },
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };



