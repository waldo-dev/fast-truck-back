import bcrypt from 'bcrypt';
import { AppError } from '../../shared/errors';
import { Plan, UserBusiness } from '../../shared/database/models';
import { SubscriptionStatus, UserRole } from '../../shared/database/models/enums';
import { businessRepository } from '../business/business.repository';
import { subscriptionRepository } from '../subscriptions/subscription.repository';
import { userRepository } from './user.repository';

type DemoAccountResponse = {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    business_id: number | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };
  business: {
    id: number;
    name: string;
    brand_name: string | null;
    logo_url: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    is_active: boolean;
    created_at: Date;
  };
  credentials: {
    email: string;
    password: string;
  };
  metadata: {
    tipo_negocio: string;
    telefono: string;
  };
};

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

  public async createDemoUser(data: {
    nombre_cliente: string;
    email_cliente: string;
    nombre_negocio: string;
    tipo_negocio: string;
    telefono: string;
    pass: string;
  }): Promise<DemoAccountResponse> {
    const normalizedEmail = data.email_cliente.trim().toLowerCase();

    const existingUser = await userRepository.findByEmail(normalizedEmail);

    if (existingUser && existingUser.active) {
      throw new AppError('El correo ya está registrado', 400);
    }

    const business = await businessRepository.create({
      name: data.nombre_negocio,
      brand_name: data.tipo_negocio,
    });

    await this.createDemoSubscription(business.id);

    const password = data.pass.trim();

    let user;

    if (existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await existingUser.update({
        name: data.nombre_cliente,
        password: hashedPassword,
        role: UserRole.BUSINESS_OWNER,
        business_id: business.id,
        active: true,
      });

      user = await userRepository.findById(existingUser.id, business.id);
    } else {
      user = await userRepository.create({
        business_id: business.id,
        email: normalizedEmail,
        password,
        name: data.nombre_cliente,
        role: UserRole.BUSINESS_OWNER,
      });
    }

    await userRepository.setBusinessLinks(user.id, [business.id]);

    const userPlain = user.get({ plain: true });
    const businessPlain = business.get({ plain: true });

    return {
      user: {
        id: userPlain.id,
        email: userPlain.email,
        name: userPlain.name,
        role: userPlain.role,
        business_id: userPlain.business_id,
        active: userPlain.active,
        created_at: userPlain.created_at,
        updated_at: userPlain.updated_at,
      },
      business: {
        id: businessPlain.id,
        name: businessPlain.name,
        brand_name: businessPlain.brand_name,
        logo_url: businessPlain.logo_url,
        primary_color: businessPlain.primary_color,
        secondary_color: businessPlain.secondary_color,
        is_active: businessPlain.is_active,
        created_at: businessPlain.created_at,
      },
      credentials: {
        email: normalizedEmail,
        password,
      },
      metadata: {
        tipo_negocio: data.tipo_negocio,
        telefono: data.telefono,
      },
    };
  }

  private async createDemoSubscription(businessId: number) {
    const now = new Date();
    const trialEnds = new Date(now);
    trialEnds.setDate(trialEnds.getDate() + 30);

    const proPlan = await Plan.findOne({ where: { name: 'Pro' } });
    const fallbackPlan = proPlan || (await Plan.findOne({ order: [['id', 'ASC']] }));

    if (!fallbackPlan) {
      throw new AppError('No hay planes disponibles para cuentas demo', 500);
    }

    await subscriptionRepository.create({
      business_id: businessId,
      plan_id: fallbackPlan.id,
      status: SubscriptionStatus.TRIAL,
      trial_ends_at: trialEnds,
    });
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

    const user = await userRepository.update(
      id,
      {
        ...data,
        ...(targetBusinessIds && targetBusinessIds.length > 0 ? { business_id: targetBusinessIds[0] } : {}),
      },
      businessId
    );

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

  public async updateSelf(
    id: number,
    businessId: number | undefined,
    data: {
      name?: string;
      email?: string;
    }
  ) {
    if (!data.name && !data.email) {
      throw new AppError('At least one field is required', 400);
    }

    const user = await userRepository.update(id, { ...data }, businessId);

    return user;
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


