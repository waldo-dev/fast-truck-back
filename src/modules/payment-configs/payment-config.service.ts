import { AppError } from '../../shared/errors';
import { UserRole, PaymentProvider, PaymentEnvironment } from '../../shared/database/models/enums';
import { paymentConfigRepository } from './payment-config.repository';

export class PaymentConfigService {
  public async getActiveConfig(businessId: number) {
    const config = await paymentConfigRepository.findActive(businessId);
    return config;
  }

  public async getAllConfigs(businessId: number) {
    const configs = await paymentConfigRepository.findAll(businessId);
    return configs;
  }

  public async createPaymentConfig(
    data: {
      provider: PaymentProvider;
      commerce_code: string;
      api_key: string;
      environment?: PaymentEnvironment;
      active?: boolean;
    },
    businessId: number,
    userRole: UserRole
  ) {
    // Solo ADMIN puede configurar pagos
    if (userRole !== UserRole.ADMIN) {
      throw new AppError('Only ADMIN can configure payment providers', 403);
    }

    const config = await paymentConfigRepository.create({
      business_id: businessId,
      provider: data.provider,
      commerce_code: data.commerce_code,
      api_key: data.api_key,
      environment: data.environment || PaymentEnvironment.TEST,
      active: data.active !== undefined ? data.active : true,
    });

    return config;
  }
}

export const paymentConfigService = new PaymentConfigService();


