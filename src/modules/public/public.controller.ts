import { Response, NextFunction } from 'express';
import { extractBusinessId } from '../../shared/middlewares';
import { Product, Promotion, Event, PaymentConfig, PaymentMethod } from '../../shared/database/models';
import { ProductStatus, DiscountType } from '../../shared/database/models/enums';
import { Op } from 'sequelize';

export class PublicController {
  public getMenu = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.business_id || parseInt(req.query.business_id as string, 10);

      if (!businessId || isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener productos activos
      const products = await Product.findAll({
        where: {
          business_id: businessId,
          status: ProductStatus.ACTIVE,
        },
        attributes: ['id', 'name', 'description', 'price', 'image_url'],
        order: [['name', 'ASC']],
      });

      // Obtener promociones activas
      const promotions = await Promotion.findAll({
        where: {
          business_id: businessId,
          active: true,
          [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }],
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
        },
        attributes: ['id', 'name', 'description', 'discount_type', 'discount_value', 'start_date', 'end_date'],
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'price'],
            through: { attributes: [] },
          },
        ],
      });

      // Calcular precios con promociones
      const productsWithPromotions = products.map((product) => {
        const productData: any = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: product.image_url,
          final_price: product.price,
        };

        // Buscar promoción aplicable
        const applicablePromotion = promotions.find((promo) =>
          (promo as any).products.some((p: any) => p.id === product.id)
        );

        if (applicablePromotion) {
          if (applicablePromotion.discount_type === DiscountType.FIXED) {
            productData.final_price = Math.max(0, product.price - (applicablePromotion.discount_value || 0));
            productData.promotion = {
              id: applicablePromotion.id,
              name: applicablePromotion.name,
              discount_type: applicablePromotion.discount_type,
              discount_value: applicablePromotion.discount_value,
            };
          } else if (applicablePromotion.discount_type === DiscountType.PERCENTAGE) {
            const discount = Math.floor((product.price * (applicablePromotion.discount_value || 0)) / 100);
            productData.final_price = Math.max(0, product.price - discount);
            productData.promotion = {
              id: applicablePromotion.id,
              name: applicablePromotion.name,
              discount_type: applicablePromotion.discount_type,
              discount_value: applicablePromotion.discount_value,
            };
          }
        }

        return productData;
      });

      res.status(200).json({
        success: true,
        data: {
          products: productsWithPromotions,
          promotions: promotions.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            discount_type: p.discount_type,
            discount_value: p.discount_value,
            start_date: p.start_date,
            end_date: p.end_date,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public getEvents = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.business_id || parseInt(req.query.business_id as string, 10);

      if (!businessId || isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const events = await Event.findAll({
        where: {
          business_id: businessId,
          event_date: { [Op.gte]: today },
        },
        attributes: ['id', 'name', 'description', 'event_date', 'organizer'],
        order: [['event_date', 'ASC']],
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPaymentMethods = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessId = req.business_id || parseInt(req.query.business_id as string, 10);

      if (!businessId || isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      // Métodos de pago siempre disponibles
      const methods = [
        { method: PaymentMethod.CASH, name: 'Efectivo', available: true },
        { method: PaymentMethod.CARD, name: 'Tarjeta', available: true },
        { method: PaymentMethod.TRANSFER, name: 'Transferencia', available: true },
      ];

      // Verificar si hay configuración activa para WEBPAY
      const webpayConfig = await PaymentConfig.findOne({
        where: {
          business_id: businessId,
          provider: 'WEBPAY' as any,
          active: true,
        },
      });

      if (webpayConfig) {
        methods.push({
          method: PaymentMethod.WEBPAY,
          name: 'Webpay',
          available: true,
        });
      }

      res.status(200).json({
        success: true,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const publicController = new PublicController();

