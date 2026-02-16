import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { locationRepository } from './location.repository';

export class LocationService {
  public async getAllLocations(businessId: number) {
    const locations = await locationRepository.findAll(businessId);
    return locations;
  }

  public async getLocationById(id: number, businessId: number) {
    const location = await locationRepository.findById(id, businessId);
    return location;
  }

  public async createLocation(
    data: {
      name: string;
      address?: string | null;
      is_main?: boolean;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear locations
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create locations', 403);
    }

    const location = await locationRepository.create({
      business_id: businessId,
      name: data.name,
      address: data.address,
      is_main: data.is_main,
    });

    return location;
  }
}

export const locationService = new LocationService();


