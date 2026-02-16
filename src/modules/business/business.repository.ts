import { Business } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class BusinessRepository {
  public async findAll(businessId: number) {
    // Scoping: solo retornar el business del usuario autenticado
    const businesses = await Business.findAll({
      where: { id: businessId },
    });

    return businesses;
  }

  public async findById(id: number, businessId: number) {
    // Scoping: verificar que el business pertenezca al usuario
    // Solo puede acceder a su propio business (id debe coincidir con businessId)
    if (id !== businessId) {
      throw new AppError('Business not found', 404);
    }

    const business = await Business.findByPk(id);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    return business;
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
    if (id !== businessId) {
      throw new AppError('Business not found', 404);
    }

    const business = await Business.findByPk(id);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    await business.update(data);
    return business.reload();
  }

  public async delete(id: number, businessId: number) {
    // Scoping: solo puede eliminar su propio business
    if (id !== businessId) {
      throw new AppError('Business not found', 404);
    }

    const business = await Business.findByPk(id);

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    await business.destroy();
  }
}

export const businessRepository = new BusinessRepository();

