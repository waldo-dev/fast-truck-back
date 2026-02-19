import bcrypt from 'bcrypt';
import { User } from '../../shared/database/models';
import { UserRole } from '../../shared/database/models/enums';
import { AppError } from '../../shared/errors';

export class UserRepository {
  public async findAll(businessId: number) {
    const users = await User.findAll({
      where: {
        business_id: businessId,
      },
      attributes: ['id', 'email', 'name', 'role', 'active', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    return users;
  }

  public async findById(id: number, businessId: number) {
    const user = await User.findOne({
      where: {
        id,
        business_id: businessId,
      },
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  public async findByEmail(email: string, businessId: number) {
    const user = await User.findOne({
      where: {
        email,
        business_id: businessId,
      },
    });

    return user;
  }

  public async create(data: {
    business_id: number;
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) {
    // Verificar que el email no esté en uso
    const existingUser = await this.findByEmail(data.email, data.business_id);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    // Hash password
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
    businessId: number,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      active?: boolean;
    }
  ) {
    const user = await this.findById(id, businessId);

    // Si se cambia el email, verificar que no esté en uso
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email, businessId);
      if (existingUser) {
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
}

export const userRepository = new UserRepository();


