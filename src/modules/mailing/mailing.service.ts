import { mailingRepository, Campaign } from './mailing.repository';

export class MailingService {
  public async getDashboard(businessId: number) {
    return mailingRepository.getDashboard(businessId);
  }

  public async listCampaigns(businessId: number): Promise<Campaign[]> {
    return mailingRepository.listCampaigns(businessId);
  }

  public async createCampaign(
    businessId: number,
    data: {
      name: string;
      subject: string;
      preheader?: string | null;
      sender: string;
      segment: string;
      segment_size?: number;
      content: string;
      send_type: 'IMMEDIATE' | 'SCHEDULED';
      send_at?: string | null;
      ab_test_subject?: boolean;
      auto_utm?: boolean;
    }
  ) {
    return mailingRepository.createCampaign(businessId, data);
  }

  public async sendBulk(data: { from: string; to: string[]; subject: string; html: string }) {
    return mailingRepository.sendBulk(data);
  }
}

export const mailingService = new MailingService();


