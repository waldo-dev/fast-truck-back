import { resendClient } from '../../shared/email/resend';

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED';
type SendType = 'IMMEDIATE' | 'SCHEDULED';

interface Campaign {
  id: number;
  business_id: number;
  name: string;
  subject: string;
  preheader?: string | null;
  sender: string;
  segment: string;
  segment_size?: number;
  content: string;
  status: CampaignStatus;
  send_type: SendType;
  send_at?: Date | null;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  created_at: Date;
  updated_at: Date;
}

// Datos mock para habilitar la vista del front sin depender aún de tablas reales
const campaigns: Campaign[] = [
  {
    id: 1,
    business_id: 1,
    name: 'Bienvenida clientes',
    subject: '¡Gracias por registrarte!',
    preheader: 'Un cupón de bienvenida te espera',
    sender: 'OperFoods <noreply@operfoods.com>',
    segment: 'Clientes activos',
    segment_size: 1200,
    content: '<h1>Bienvenido</h1>',
    status: 'SENT',
    send_type: 'IMMEDIATE',
    send_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    open_rate: 0.45,
    click_rate: 0.12,
    unsubscribe_rate: 0.01,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 2,
    business_id: 1,
    name: 'Promo fin de semana',
    subject: 'Solo por este finde',
    preheader: 'Descuentos especiales',
    sender: 'OperFoods <noreply@operfoods.com>',
    segment: 'Compradores últimos 30 días',
    segment_size: 800,
    content: '<h1>Promo</h1>',
    status: 'SCHEDULED',
    send_type: 'SCHEDULED',
    send_at: new Date(Date.now() + 1000 * 60 * 60 * 6),
    open_rate: 0.0,
    click_rate: 0.0,
    unsubscribe_rate: 0.0,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export class MailingRepository {
  public async getDashboard(businessId: number) {
    const scoped = campaigns.filter((c) => c.business_id === businessId);

    const sent = scoped.filter((c) => c.status === 'SENT' || c.status === 'SENDING');
    const totalContacts = scoped.reduce((sum, c) => sum + (c.segment_size || 0), 0);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

    const scheduled = scoped
      .filter((c) => c.status === 'SCHEDULED' && c.send_at && c.send_at.getTime() > Date.now())
      .sort((a, b) => (a.send_at?.getTime() || 0) - (b.send_at?.getTime() || 0));

    const lastCampaign = sent
      .filter((c) => c.send_at)
      .sort((a, b) => (b.send_at?.getTime() || 0) - (a.send_at?.getTime() || 0))[0];

    return {
      summary: {
        total_contacts: totalContacts,
        campaigns_sent: sent.length,
        open_rate_avg: avg(sent.map((c) => c.open_rate)),
        click_rate_avg: avg(sent.map((c) => c.click_rate)),
        unsubscribe_rate_avg: avg(sent.map((c) => c.unsubscribe_rate)),
      },
      scheduled: scheduled.map((c) => ({
        id: c.id,
        name: c.name,
        send_at: c.send_at,
        subject: c.subject,
      })),
      last_campaign: lastCampaign
        ? {
            id: lastCampaign.id,
            name: lastCampaign.name,
            subject: lastCampaign.subject,
            send_at: lastCampaign.send_at,
            open_rate: lastCampaign.open_rate,
            click_rate: lastCampaign.click_rate,
            unsubscribe_rate: lastCampaign.unsubscribe_rate,
          }
        : null,
    };
  }

  public async listCampaigns(businessId: number) {
    return campaigns
      .filter((c) => c.business_id === businessId)
      .sort((a, b) => (b.created_at?.getTime() || 0) - (a.created_at?.getTime() || 0));
  }

  public async createCampaign(businessId: number, data: {
    name: string;
    subject: string;
    preheader?: string | null;
    sender: string;
    segment: string;
    segment_size?: number;
    content: string;
    send_type: SendType;
    send_at?: string | null;
    ab_test_subject?: boolean;
    auto_utm?: boolean;
  }) {
    const now = new Date();
    const newCampaign: Campaign = {
      id: Date.now(),
      business_id: businessId,
      name: data.name,
      subject: data.subject,
      preheader: data.preheader ?? null,
      sender: data.sender,
      segment: data.segment,
      segment_size: data.segment_size,
      content: data.content,
      status: data.send_type === 'IMMEDIATE' ? 'SENDING' : 'SCHEDULED',
      send_type: data.send_type,
      send_at: data.send_type === 'IMMEDIATE' ? now : data.send_at ? new Date(data.send_at) : null,
      open_rate: 0,
      click_rate: 0,
      unsubscribe_rate: 0,
      created_at: now,
      updated_at: now,
    };

    campaigns.push(newCampaign);
    return newCampaign;
  }

  public async sendBulk(params: { from: string; to: string[]; subject: string; html: string }) {
    const result = await resendClient.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    return result;
  }
}

export const mailingRepository = new MailingRepository();


