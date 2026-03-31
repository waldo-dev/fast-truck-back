import { Business, UserBusiness, BusinessOperatingContext, Order, Product, Customer } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { BusinessStatus, OrderStatus } from '../../shared/database/models/enums';
import { Op, fn, col } from 'sequelize';

export class BusinessRepository {
  public async findAll(businessId: number) {
    // Scoping: solo retornar el business del usuario autenticado
    const business = await Business.findAll({
      where: { id: businessId, is_active: true },
    });

    return business;
  }

  public async findAllAdmin() {
    const business = await Business.findAll({
      where: { is_active: true },
    });
    return business;
  }

  public async findById(id: number) {
    // Scoping: verificar que el business pertenezca al usuario
    // Solo puede acceder a su propio business (id debe coincidir con businessId)
    //if (id !== businessId) {
    //  throw new AppError('Business not found', 404);
    //}

    const business = await Business.findOne({
      where: { id: Number(id), is_active: true },
      include: [{ association: 'operatingContext' }],
    });

    //if (!business) {
    //  throw new AppError('Business not found', 404);
    //}

    return business;
  }

  public async findByUser(userId: number) {
    // Buscar business vinculados vía tabla intermedia user_business
    const links = await UserBusiness.findAll({
      where: { user_id: userId },
      attributes: ['business_id'],
    });

    const businessIds = Array.from(new Set(links.map((l) => l.business_id).filter(Boolean)));

    if (businessIds.length === 0) {
      return [];
    }

    return Business.findAll({
      where: { id: businessIds, is_active: true },
      include: [{ association: 'operatingContext' }],
    });
  }

  public async create(data: {
    name: string;
    brand_name?: string | null;
    slug?: string | null;
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    status?: BusinessStatus;
    created_by_user_id?: number | null;
  }) {
    const business = await Business.create(data);
    return business;
  }

  public async update(
    id: number,
    data: {
      name?: string;
      brand_name?: string | null;
      slug?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
      status?: BusinessStatus;
    }
  ) {
    // Scoping: solo puede actualizar su propio business
    //if (id !== businessId) {
    //  throw new AppError('Business not found', 404);
    //}

    const business = await Business.findByPk(id);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    await business.update(data);
    return business.reload();
  }

  public async delete(id: number) {
    // Scoping: solo puede eliminar su propio business
    //if (id !== businessId) {
    //  throw new AppError('Business not found', 404);
   // }

    const business = await Business.findByPk(id);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    await business.update({ is_active: false });
  }

  public async getOperatingContext(businessId: number) {
    return BusinessOperatingContext.findOne({
      where: { business_id: businessId },
      include: ['location', 'event'],
    });
  }

  public async upsertOperatingContext(data: {
    business_id: number;
    mode: 'LOCAL' | 'EVENT';
    location_id?: number | null;
    event_id?: number | null;
  }) {
    const [context] = await BusinessOperatingContext.upsert(
      {
        business_id: data.business_id,
        mode: data.mode,
        location_id: data.mode === 'LOCAL' ? data.location_id ?? null : null,
        event_id: data.mode === 'EVENT' ? data.event_id ?? null : null,
        updated_at: new Date(),
      },
      { returning: true }
    );

    return context;
  }

  public async getDashboardTotals(businessIds: number[], todayStart: Date, todayEnd: Date) {
    const [totalOrders, todayOrders, activeProducts] = await Promise.all([
      Order.count({
        where: { business_id: { [Op.in]: businessIds } },
      }),
      Order.count({
        where: {
          business_id: { [Op.in]: businessIds },
          created_at: { [Op.between]: [todayStart, todayEnd] },
        },
      }),
      Product.count({
        where: {
          business_id: { [Op.in]: businessIds },
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      total_orders: totalOrders,
      today_orders: todayOrders,
      active_products: activeProducts,
    };
  }

  public async getRecentOrders(businessIds: number[], limit = 10) {
    const orders = await Order.findAll({
      where: { business_id: { [Op.in]: businessIds } },
      include: [
        {
          model: Business,
          as: 'business',
          attributes: ['id', 'name', 'brand_name', 'logo_url'],
        },
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    return orders;
  }

  public async getTopBusinessesBySales(businessIds: number[], limit = 5) {
    const rows = await Order.findAll({
      where: {
        business_id: { [Op.in]: businessIds },
        status: { [Op.ne]: OrderStatus.CANCELLED },
      },
      attributes: [
        'business_id',
        [fn('COUNT', col('id')), 'order_count'],
        [fn('SUM', col('total')), 'total_sales'],
      ],
      group: ['business_id'],
      order: [[fn('SUM', col('total')), 'DESC']],
      limit,
    });

    return rows;
  }
}

export const businessRepository = new BusinessRepository();

