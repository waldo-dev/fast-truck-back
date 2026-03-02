import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { businessRepository } from './business.repository';
import { UserBusiness } from '../../shared/database/models/UserBusiness';
import { BusinessOperatingContext } from '../../shared/database/models';

export class BusinessService {
  public async getAllbusiness(businessId: number) {
    return businessRepository.findAll(businessId);
  }

  public async getAllBusinessesAdmin() {
    return businessRepository.findAllAdmin();
  }

  public async getBusinessesForUser(userId: number) {
    return businessRepository.findByUser(userId);
  }

  public async getBusinessById(id: number, businessId: number) {
    console.log("🚀 ~ BusinessService ~ getBusinessById ~ businessId:", businessId)
    console.log("🚀 ~ BusinessService ~ getBusinessById ~ id:", id)
    const business = await businessRepository.findById(id);
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
    userRole: UserRole,
    userId: number
  ) {
    // Permitir ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create business', 403);
    }

    const business = await businessRepository.create(data);

    // Asociar al usuario creador en la tabla intermedia
    await UserBusiness.create({ user_id: userId, business_id: business.id });
    return business;
  }

  public async updateBusiness(
    id: number,
    data: {
      name?: string;
      brand_name?: string | null;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
    },
    userRole: UserRole
  ) {
    // Permitir ADMIN o BUSINESS_OWNER
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(userRole)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update business', 403);
    }

    const business = await businessRepository.update(id, data);
    return business;
  }

  public async deleteBusiness(id: number, userRole: UserRole) {
    // Solo ADMIN puede eliminar business
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can delete business', 403);
    }

    await businessRepository.delete(id);
  }

  public async getOperatingContext(businessId: number) {
    return businessRepository.getOperatingContext(businessId);
  }

  public async updateOperatingContext(
    businessId: number,
    data: { mode: 'LOCAL' | 'EVENT'; location_id?: number | null; event_id?: number | null },
    role: UserRole
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update operating context', 403);
    }

    if (data.mode === 'LOCAL' && !data.location_id) {
      throw new AppError('location_id is required for LOCAL mode', 400);
    }

    if (data.mode === 'EVENT' && !data.event_id) {
      throw new AppError('event_id is required for EVENT mode', 400);
    }

    const context = await businessRepository.upsertOperatingContext({
      business_id: businessId,
      mode: data.mode,
      location_id: data.mode === 'LOCAL' ? data.location_id ?? null : null,
      event_id: data.mode === 'EVENT' ? data.event_id ?? null : null,
    });

    return context;
  }
}

export const businessService = new BusinessService();


