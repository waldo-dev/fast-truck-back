import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, UserBusiness } from '../../shared/database/models';
import { UserRole } from '../../shared/database/models/enums';
import { AppError } from '../../shared/errors';

export class UserRepository {
  public async findAll(businessId: number) {
    const users = await User.findAll({
      where: {
        business_id: businessId,
        active: true,
      },
      attributes: ['id', 'email', 'name', 'role', 'active', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    return users;
  }

  public async findById(id: number, _businessId?: number) {
    const user = await User.findOne({
      where: {
        id,
      },
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  public async findActiveById(id: number, businessId?: number) {
    const user = await User.findOne({
      where: {
        id,
        ...(businessId ? { business_id: businessId } : {}),
        active: true,
      },
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  public async findByEmail(email: string) {
    return User.findOne({
      where: { email },
    });
  }
  
  public async findByEmailAndActive(email: string) {
    return User.findOne({
      where: { email, active: true },
    });
  }

  public async findAllByBusiness(businessId: number) {
    const links = await UserBusiness.findAll({
      where: { business_id: businessId },
      attributes: ['user_id'],
    });

    const linkedUserIds = Array.from(new Set(links.map((link) => link.user_id)));

    const users = await User.findAll({
      where: {
        active: true,
        [Op.or]: [
          { business_id: businessId },
          ...(linkedUserIds.length > 0 ? [{ id: { [Op.in]: linkedUserIds } }] : []),
        ],
      },
      attributes: ['id', 'email', 'name', 'role', 'active', 'business_id', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    return users;
  }

  public async findAdminsAndOwners() {
    const users = await User.findAll({
      where: {
        role: { [Op.in]: [UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR] },
        active: true,
      },
      attributes: ['id', 'email', 'name', 'role', 'active', 'business_id', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((u) => u.id);

    const links = await UserBusiness.findAll({
      where: { user_id: { [Op.in]: userIds } },
      attributes: ['user_id', 'business_id'],
    });

    const businessByUser = new Map<number, Set<number>>();
    for (const user of users) {
      const set = new Set<number>();
      if (user.business_id) {
        set.add(user.business_id);
      }
      businessByUser.set(user.id, set);
    }

    for (const link of links) {
      const set = businessByUser.get(link.user_id);
      if (set) {
        set.add(link.business_id);
      }
    }

    return users.map((user) => {
      const plain = user.get({ plain: true });
      const businessIds = Array.from(businessByUser.get(user.id) ?? []);
      return { ...plain, business_ids: businessIds };
    });
  }

  public async getUserWithBusinessIds(id: number) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const links = await UserBusiness.findAll({
      where: { user_id: id },
      attributes: ['business_id'],
    });

    const businessIds = new Set<number>();
    if (user.business_id) {
      businessIds.add(user.business_id);
    }
    for (const link of links) {
      businessIds.add(link.business_id);
    }

    return {
      user,
      businessIds: Array.from(businessIds),
    };
  }

  public async updatePassword(id: number, hashedPassword: string) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({ password: hashedPassword });
    return user.reload({
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });
  }

  public async create(data: {
    business_id: number;
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) {
    const existingUser = await this.findByEmailAndActive(data.email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      business_id: data.business_id,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      active: true,
    });

    return this.findById(user.id, data.business_id);
  }

  public async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      active?: boolean;
      business_id?: number;
      slug?: string;
    },
    businessId?: number
  ) {
    const user = await this.findById(id, businessId);

    // Si se cambia el email, verificar que no esté en uso
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new AppError('Email already in use', 400);
      }
    }

    await user.update(data);
    return user.reload();
  }

  public async deactivate(id: number, businessId: number) {
    const user = await this.findById(id, businessId);
    await user.update({ active: false });
    return user.reload();
  }

  public async setBusinessLinks(userId: number, businessIds: number[]) {
    const uniqueIds = Array.from(new Set(businessIds));

    // Eliminar asociaciones previas
    await UserBusiness.destroy({ where: { user_id: userId } });

    if (uniqueIds.length === 0) {
      return;
    }

    // Crear asociaciones nuevas
    await UserBusiness.bulkCreate(uniqueIds.map((businessId) => ({ user_id: userId, business_id: businessId })));
  }
}

export const userRepository = new UserRepository();


