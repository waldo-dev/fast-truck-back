import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { userRepository } from './user.repository';

export class UserService {
  public async getAllUsers(businessId: number) {
    const users = await userRepository.findAll(businessId);
    return users;
  }

  public async getUserById(id: number, businessId: number) {
    const user = await userRepository.findById(id, businessId);
    return user;
  }

  public async createUser(
    data: {
      email: string;
      password: string;
      name: string;
      role?: UserRole;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Solo ADMIN puede crear usuarios
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can create users', 403);
    }

    // Solo se pueden crear usuarios STAFF (no otros ADMIN)
    const role = data.role || UserRole.STAFF;
    if (role !== UserRole.STAFF) {
      throw new AppError('Can only create STAFF users', 403);
    }

    const user = await userRepository.create({
      business_id: businessId,
      email: data.email,
      password: data.password,
      name: data.name,
      role,
    });

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
    userRole: UserRole
  ) {
    // Solo ADMIN puede actualizar usuarios
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can update users', 403);
    }

    const user = await userRepository.update(id, businessId, data);
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
}

export const userService = new UserService();


