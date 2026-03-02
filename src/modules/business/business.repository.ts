import { Business, UserBusiness, BusinessOperatingContext } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class BusinessRepository {
  public async findAll(businessId: number) {
    // Scoping: solo retornar el business del usuario autenticado
    const business = await Business.findAll({
      where: { id: businessId },
    });

    return business;
  }

  public async findAllAdmin() {
    const business = await Business.findAll();
    return business;
  }

  public async findById(id: number) {
    // Scoping: verificar que el business pertenezca al usuario
    // Solo puede acceder a su propio business (id debe coincidir con businessId)
    //if (id !== businessId) {
    //  throw new AppError('Business not found', 404);
    //}

    const business = await Business.findByPk(Number(id), {
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
    console.log("🚀 ~ BusinessRepository ~ findByUser ~ links:", links)

    const businessIds = Array.from(new Set(links.map((l) => l.business_id).filter(Boolean)));
    console.log("🚀 ~ BusinessRepository ~ findByUser ~ businessIds:", businessIds)

    if (businessIds.length === 0) {
      return [];
    }

    return Business.findAll({
      where: { id: businessIds },
      include: [{ association: 'operatingContext' }],
    });
  }

  public async create(data: {
    name: string;
    brand_name?: string | null;
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  }) {
    const business = await Business.create(data);
    return business;
  }

  public async update(
    id: number,
    data: {
      name?: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
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

    await business.destroy();
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
}

export const businessRepository = new BusinessRepository();

