import { User } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class AuthRepository {
  public async findByEmail(email: string) {
    const user = await User.findOne({
      where: { email },
    });

    return user;
  }

  public async findById(id: number) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'business_id', 'active', 'created_at'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

export const authRepository = new AuthRepository();

