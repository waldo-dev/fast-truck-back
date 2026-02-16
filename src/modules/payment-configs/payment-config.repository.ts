import { PaymentConfig } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { PaymentProvider } from '../../shared/database/models/enums';

export class PaymentConfigRepository {
  public async findActive(businessId: number) {
    const config = await PaymentConfig.findOne({
      where: {
        business_id: businessId,
        active: true,
      },
    });

    return config;
  }

  public async findAll(businessId: number) {
    const configs = await PaymentConfig.findAll({
      where: {
        business_id: businessId,
      },
      order: [['active', 'DESC'], ['created_at', 'DESC']],
    });

    return configs;
  }

  public async findById(id: number, businessId: number) {
    const config = await PaymentConfig.findOne({
      where: {
        id,
        business_id: businessId,
      },
    });

    if (!config) {
      throw new AppError('Payment config not found', 404);
    }

    return config;
  }

  public async create(data: {
    business_id: number;
    provider: PaymentProvider;
    commerce_code: string;
    api_key: string;
    environment: string;
    active?: boolean;
  }) {
    // Si se marca como activo, desactivar otras configuraciones del mismo provider
    if (data.active) {
      await PaymentConfig.update(
        { active: false },
        {
          where: {
            business_id: data.business_id,
            provider: data.provider,
            active: true,
          },
        }
      );
    }

    const config = await PaymentConfig.create(data);
    return config.reload();
  }
}

export const paymentConfigRepository = new PaymentConfigRepository();


