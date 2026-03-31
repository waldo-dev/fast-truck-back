import express, { Application } from 'express';
import { logger } from './shared/utils';
import { errorHandler, notFoundHandler } from './shared/middlewares';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import businessRoutes from './modules/business/business.routes';
import demoUserRoutes from './modules/users/demo-user.routes';
import userRoutes from './modules/users/user.routes';
import customerRoutes from './modules/customers/customer.routes';
import categoryRoutes from './modules/categories/category.routes';
import productRoutes from './modules/products/product.routes';
import productOptionRoutes from './modules/product-options/product-option.routes';
import promotionRoutes from './modules/promotions/promotion.routes';
import locationRoutes from './modules/locations/location.routes';
import eventRoutes from './modules/events/event.routes';
import orderRoutes from './modules/orders/order.routes';
import paymentRoutes from './modules/payments/payment.routes';
import paymentConfigRoutes from './modules/payment-configs/payment-config.routes';
import mailingRoutes from './modules/mailing/mailing.routes';
import publicRoutes from './modules/public/public.routes';
import planRoutes from './modules/plans/plan.routes';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import cashRegisterRoutes from './modules/cash-registers/cash-register.routes';

const createApp = (): Application => {
  const app = express();

  const allowedOrigins = ['https://fast-trucks.chilsmart.com', 'http://localhost:3000', 'https://app.operfoods.com', 'https://n8n.chilsmart.com'];
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  // Middlewares básicos
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging de requests
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/', healthRoutes);
  app.use('/auth', authRoutes);
  app.use('/business', businessRoutes);
  app.use('/users/demo', demoUserRoutes);
  app.use('/users', userRoutes);
  app.use('/customers', customerRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/products', productRoutes);
  app.use('/public', publicRoutes);
  app.use('/', productOptionRoutes); // /products/:id/options y /product-options/:id
  app.use('/promotions', promotionRoutes);
  app.use('/locations', locationRoutes);
  app.use('/events', eventRoutes);
  app.use('/orders', orderRoutes);
  app.use('/', inventoryRoutes);
  app.use('/payments', paymentRoutes);
  app.use('/payment-configs', paymentConfigRoutes);
  app.use('/mailing', mailingRoutes);
  app.use('/public', publicRoutes);
  app.use('/plans', planRoutes);
  app.use('/subscriptions', subscriptionRoutes);
  app.use('/', cashRegisterRoutes);

  // Error handlers (deben ir al final)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

