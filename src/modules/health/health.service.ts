import { healthRepository } from './health.repository';

export class HealthService {
  public async getHealthStatus() {
    const systemInfo = await healthRepository.getSystemInfo();

    return {
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      ...systemInfo,
    };
  }
}

export const healthService = new HealthService();

