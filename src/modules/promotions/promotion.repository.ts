import { Op } from 'sequelize';
import { Promotion, PromotionProduct, Product, PromotionBusiness, Business } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { DiscountType } from '../../shared/database/models/enums';

export class PromotionRepository {
  public async findAll(businessId: number, filters?: { active?: boolean }) {
    const where: any = {
      [Op.or]: [{ business_id: businessId }, { '$businesses.id$': businessId }],
    };

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const promotions = await Promotion.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'image_url'],
          through: {
            attributes: [],
          },
        },
        {
          model: Business,
          as: 'businesses',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['start_date', 'DESC'], ['id', 'DESC']],
    });

    return promotions;
  }

  public async findAllByBusinessIds(businessIds: number[], filters?: { active?: boolean }) {
    const where: any = {
      [Op.or]: [{ business_id: { [Op.in]: businessIds } }, { '$businesses.id$': { [Op.in]: businessIds } }],
    };

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    return Promotion.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'image_url'],
          through: {
            attributes: [],
          },
        },
        {
          model: Business,
          as: 'businesses',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['start_date', 'DESC'], ['id', 'DESC']],
    });
  }

  public async findById(id: number, businessId: number) {
    const promotion = await Promotion.findOne({
      where: {
        id,
        [Op.or]: [{ business_id: businessId }, { '$businesses.id$': businessId }],
      },
      include: [
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'name', 'price', 'image_url'],
          through: {
            attributes: [],
          },
        },
        {
          model: Business,
          as: 'businesses',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }

    return promotion;
  }

  public async create(data: {
    business_id: number;
    name: string;
    description?: string | null;
    discount_type: DiscountType;
    discount_value: number;
    start_date?: Date | null;
    end_date?: Date | null;
    active?: boolean;
    product_ids?: number[];
    business_ids?: number[];
  }) {
    const { product_ids, business_ids, ...promotionData } = data;

    const promotion = await Promotion.create({
      ...promotionData,
      active: promotionData.active !== undefined ? promotionData.active : true,
    });

    // Asociar productos si se proporcionan
    if (product_ids && product_ids.length > 0) {
      const allowedBusinessIds =
        business_ids && business_ids.length > 0 ? Array.from(new Set<number>(business_ids)) : [data.business_id];

      // Verificar que los productos pertenezcan a alguno de los businesses asociados
      const products = await Product.findAll({
        where: {
          id: { [Op.in]: product_ids },
          business_id: { [Op.in]: allowedBusinessIds },
        },
      });

      if (products.length !== product_ids.length) {
        throw new AppError('Some products do not exist or do not belong to the provided businesses', 400);
      }

      await PromotionProduct.bulkCreate(
        product_ids.map((productId) => ({
          promotion_id: promotion.id,
          product_id: productId,
        }))
      );
    }

    // Asociar negocios si se proporcionan
    const targetBusinesses =
      business_ids && business_ids.length > 0 ? Array.from(new Set<number>(business_ids)) : [data.business_id];

    if (!targetBusinesses.includes(data.business_id)) {
      targetBusinesses.push(data.business_id);
    }

    await PromotionBusiness.bulkCreate(
      targetBusinesses.map((businessId) => ({
        promotion_id: promotion.id,
        business_id: businessId,
      })),
      { ignoreDuplicates: true }
    );

    return this.findById(promotion.id, data.business_id);
  }

  public async update(
    id: number,
    businessId: number,
    data: {
      name?: string;
      description?: string | null;
      discount_type?: DiscountType;
      discount_value?: number;
      start_date?: Date | null;
      end_date?: Date | null;
      active?: boolean;
      product_ids?: number[];
      business_ids?: number[];
    }
  ) {
    const promotion = await this.findById(id, businessId);

    const { product_ids, business_ids, ...promotionData } = data;

    await promotion.update(promotionData);

    // Actualizar productos asociados si se proporcionan
    if (product_ids !== undefined) {
      // Eliminar todas las asociaciones existentes
      await PromotionProduct.destroy({
        where: {
          promotion_id: id,
        },
      });

      // Crear nuevas asociaciones si hay productos
      if (product_ids.length > 0) {
        // Verificar que los productos pertenezcan al mismo business
        const products = await Product.findAll({
          where: {
            id: { [Op.in]: product_ids },
            business_id: businessId,
          },
        });

        if (products.length !== product_ids.length) {
          throw new AppError('Some products do not exist or do not belong to this business', 400);
        }

        await PromotionProduct.bulkCreate(
          product_ids.map((productId) => ({
            promotion_id: id,
            product_id: productId,
          }))
        );
      }
    }

    // Actualizar negocios asociados si se proporcionan
    if (business_ids !== undefined) {
      const targetBusinesses = Array.from(new Set<number>(business_ids));

      // limpiar asociaciones previas
      await PromotionBusiness.destroy({
        where: { promotion_id: id },
      });

      if (targetBusinesses.length > 0) {
        await PromotionBusiness.bulkCreate(
          targetBusinesses.map((businessId) => ({
            promotion_id: id,
            business_id: businessId,
          })),
          { ignoreDuplicates: true }
        );
      }
    }

    return this.findById(id, businessId);
  }

  public async toggleStatus(id: number, businessId: number, active: boolean) {
    const promotion = await this.findById(id, businessId);
    await promotion.update({ active });
    return promotion.reload();
  }

  public async addProducts(promotionId: number, businessId: number, productIds: number[]) {

    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        business_id: businessId,
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError('Some products do not exist or do not belong to this business', 400);
    }

    // Verificar productos que ya están asociados
    const existingAssociations = await PromotionProduct.findAll({
      where: {
        promotion_id: promotionId,
        product_id: { [Op.in]: productIds },
      },
    });

    const existingProductIds = existingAssociations.map((assoc) => assoc.product_id);
    const newProductIds = productIds.filter((id) => !existingProductIds.includes(id));

    if (newProductIds.length > 0) {
      await PromotionProduct.bulkCreate(
        newProductIds.map((productId) => ({
          promotion_id: promotionId,
          product_id: productId,
        }))
      );
    }

    return this.findById(promotionId, businessId);
  }

  public async removeProducts(promotionId: number, businessId: number, productIds: number[]) {
    await this.findById(promotionId, businessId);

    await PromotionProduct.destroy({
      where: {
        promotion_id: promotionId,
        product_id: { [Op.in]: productIds },
      },
    });

    return this.findById(promotionId, businessId);
  }

  public async delete(id: number, businessId: number) {
    const promotion = await this.findById(id, businessId);
    await promotion.destroy();
  }
}

export const promotionRepository = new PromotionRepository();

