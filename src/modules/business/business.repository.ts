import { Business, UserBusiness } from '../../shared/database/models';
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

  public async findById(id: number, businessId: number) {
    // Scoping: verificar que el business pertenezca al usuario
    // Solo puede acceder a su propio business (id debe coincidir con businessId)
    //if (id !== businessId) {
    //  throw new AppError('Business not found', 404);
    //}

    const business = await Business.findByPk(Number(id));

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
    businessId: number,
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

  public async delete(id: number, businessId: number) {
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
}

export const businessRepository = new BusinessRepository();

