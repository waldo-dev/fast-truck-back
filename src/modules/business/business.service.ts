import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { businessRepository } from './business.repository';

export class BusinessService {
  public async getAllBusinesses(businessId: number) {
    const businesses = await businessRepository.findAll(businessId);
    return businesses;
  }

  public async getBusinessById(id: number, businessId: number) {
    const business = await businessRepository.findById(id, businessId);
    return business;
  }

  public async createBusiness(
    data: {
      name: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear businesses
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create businesses', 403);
    }

    const business = await businessRepository.create(data);
    return business;
  }

  public async updateBusiness(
    id: number,
    businessId: number,
    data: {
      name?: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    },
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar businesses
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update businesses', 403);
    }

    const business = await businessRepository.update(id, businessId, data);
    return business;
  }

  public async deleteBusiness(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar businesses
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete businesses', 403);
    }

    await businessRepository.delete(id, businessId);
  }
}

export const businessService = new BusinessService();


