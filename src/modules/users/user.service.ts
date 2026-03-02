import bcrypt from 'bcrypt';
import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { userRepository } from './user.repository';
import { UserBusiness } from '../../shared/database/models';

export class UserService {
  private async getAllowedBusinessIds(userId: number, defaultBusinessId?: number | null) {
    const ids = new Set<number>();

    if (defaultBusinessId) {
      ids.add(defaultBusinessId);
    }

    const links = await UserBusiness.findAll({
      where: { user_id: userId },
      attributes: ['business_id'],
    });

    for (const link of links) {
      if (link.business_id) {
        ids.add(link.business_id);
      }
    }

    return Array.from(ids);
  }

  public async getUsersByBusiness(
    businessId: number,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can access this resource', 403);
    }

    const allowedBusinessIds = await this.getAllowedBusinessIds(requester.id, requester.businessId);

    if (!allowedBusinessIds.includes(businessId)) {
      throw new AppError('Business not associated to this user', 403);
    }

    const users = await userRepository.findAllByBusiness(businessId);
    return users;
  }

  public async getAdminsAndOwners(requester: { id: number; role: UserRole; businessId?: number | null }) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can access this resource', 403);
    }

    // Aunque el endpoint pueda filtrar opcionalmente por business, ahora se retornan
    // todos los usuarios con roles permitidos (ADMIN, BUSINESS_OWNER, LOCAL_OPERATOR).
    // La autorización se maneja arriba por rol del solicitante.
    // Si se quisiera volver a limitar por negocio, se debería reintroducir el filtro aquí.
    return userRepository.findAdminsAndOwners();
  }

  public async getAllUsers(businessId: number) {
    const users = await userRepository.findAll(businessId);
    return users;
  }

  public async getUserById(id: number, businessId: number) {
    const user = await userRepository.findActiveById(id, businessId);
    return user;
  }

  public async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
    },
    businessIds: number[] | undefined,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    // Solo ADMIN o BUSINESS_OWNER pueden crear usuarios
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can create users', 403);
    }

    const role = data.role || UserRole.LOCAL_OPERATOR;

    if (requester.role === UserRole.BUSINESS_OWNER && role !== UserRole.LOCAL_OPERATOR) {
      throw new AppError('BUSINESS_OWNER can only create LOCAL_OPERATOR users', 403);
    }

    const allowedBusinessIds =
      requester.role === UserRole.ADMIN
        ? undefined
        : await this.getAllowedBusinessIds(requester.id, requester.businessId);

    const targetBusinessIds =
      businessIds && businessIds.length > 0
        ? Array.from(new Set(businessIds))
        : allowedBusinessIds;

    if (!targetBusinessIds || targetBusinessIds.length === 0) {
      throw new AppError('At least one business is required to create a user', 400);
    }

    if (requester.role !== UserRole.ADMIN && allowedBusinessIds) {
      const unauthorized = targetBusinessIds.filter((id) => !allowedBusinessIds.includes(id));
      if (unauthorized.length > 0) {
        throw new AppError(`Business not associated to this user: ${unauthorized.join(',')}`, 403);
      }
    }

    const primaryBusinessId = targetBusinessIds[0];

    const user = await userRepository.create({
      business_id: primaryBusinessId,
      email: data.email,
      password: data.password,
      name: data.name,
      role,
    });

    await userRepository.setBusinessLinks(user.id, targetBusinessIds);

    return user;
  }

  public async updateUser(
    id: number,
    businessId: number,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      active?: boolean;
    },
    businessIds: number[] | undefined,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    // Solo ADMIN o BUSINESS_OWNER pueden actualizar usuarios
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update users', 403);
    }

    // No permitir que OWNER escale roles a ADMIN/OWNER
    if (requester.role !== UserRole.ADMIN && data.role && data.role !== UserRole.LOCAL_OPERATOR) {
      throw new AppError('Only ADMIN can change role to ADMIN or BUSINESS_OWNER', 403);
    }

    let targetBusinessIds: number[] | undefined;

    if (businessIds) {
      const allowedBusinessIds =
        requester.role === UserRole.ADMIN
          ? undefined
          : await this.getAllowedBusinessIds(requester.id, requester.businessId);

      targetBusinessIds = Array.from(new Set(businessIds));
      if (targetBusinessIds.length === 0) {
        throw new AppError('At least one business is required', 400);
      }

      if (requester.role !== UserRole.ADMIN && allowedBusinessIds) {
        const unauthorized = targetBusinessIds.filter((id) => !allowedBusinessIds.includes(id));
        if (unauthorized.length > 0) {
          throw new AppError(`Business not associated to this user: ${unauthorized.join(',')}`, 403);
        }
      }
    }

    const user = await userRepository.update(id, businessId, {
      ...data,
      ...(targetBusinessIds && targetBusinessIds.length > 0 ? { business_id: targetBusinessIds[0] } : {}),
    });

    if (targetBusinessIds && targetBusinessIds.length > 0) {
      await userRepository.setBusinessLinks(user.id, targetBusinessIds);
    }

    return user;
  }

  public async deactivateUser(id: number, businessId: number, userRole: UserRole) {
    // Solo ADMIN puede desactivar usuarios
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can deactivate users', 403);
    }

    const user = await userRepository.deactivate(id, businessId);
    return user;
  }

  public async updatePassword(
    id: number,
    newPassword: string,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role)) {
      throw new AppError('Only ADMIN or BUSINESS_OWNER can update passwords', 403);
    }

    const allowedBusinessIds =
      requester.role === UserRole.ADMIN
        ? undefined
        : await this.getAllowedBusinessIds(requester.id, requester.businessId);

    const { businessIds } = await userRepository.getUserWithBusinessIds(id);

    if (requester.role !== UserRole.ADMIN && allowedBusinessIds) {
      const hasAccess = businessIds.some((businessId) => allowedBusinessIds.includes(businessId));
      if (!hasAccess) {
        throw new AppError('Business not associated to this user', 403);
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await userRepository.updatePassword(id, hashedPassword);

    return updatedUser;
  }

  public async getUsersByUserBusinesses(
    targetUserId: number,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    const isSelf = requester.id === targetUserId;
    const isAdminOrOwner = [UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role);

    if (!isSelf && !isAdminOrOwner) {
      throw new AppError('Not authorized to view users for this user', 403);
    }

    const { businessIds } = await userRepository.getUserWithBusinessIds(targetUserId);

    if (businessIds.length === 0) {
      return [];
    }

    const grouped = [];
    for (const businessId of businessIds) {
      const users = await userRepository.findAllByBusiness(businessId);
      grouped.push({ business_id: businessId, users });
    }

    return grouped;
  }
}

export const userService = new UserService();


