import { Location } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class LocationRepository {
  public async findAll(businessId: number) {
    const locations = await Location.findAll({
      where: {
        business_id: businessId,
      },
      order: [['is_main', 'DESC'], ['name', 'ASC']],
    });

    return locations;
  }

  public async findById(id: number, businessId: number) {
    const location = await Location.findOne({
      where: {
        id,
        business_id: businessId,
      },
    });

    if (!location) {
      throw new AppError('Location not found', 404);
    }

    return location;
  }

  public async create(data: { business_id: number; name: string; address?: string | null; is_main?: boolean }) {
    // Si se marca como main, quitar main de otras locations
    if (data.is_main) {
      await Location.update(
        { is_main: false },
        {
          where: {
            business_id: data.business_id,
            is_main: true,
          },
        }
      );
    }

    const location = await Location.create(data);
    return location;
  }
}

export const locationRepository = new LocationRepository();


