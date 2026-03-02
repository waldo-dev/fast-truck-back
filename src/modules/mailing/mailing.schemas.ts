import { z } from 'zod';

export const createCampaignSchema = z
  .object({
    name: z.string().min(1, 'Nombre interno requerido'),
    subject: z.string().min(1, 'Asunto requerido'),
    preheader: z.string().optional().nullable(),
    sender: z.string().min(1, 'Remitente requerido'),
    segment: z.string().min(1, 'Segmento requerido'),
    segment_size: z.number().int().positive().optional(),
    content: z.string().min(1, 'Contenido requerido'),
    send_type: z.enum(['IMMEDIATE', 'SCHEDULED']),
    send_at: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
    ab_test_subject: z.boolean().optional(),
    auto_utm: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.send_type === 'SCHEDULED') {
        return !!data.send_at;
      }
      return true;
    },
    {
      message: 'send_at es requerido cuando el envío es programado',
      path: ['send_at'],
    }
  );

export const sendMailSchema = z.object({
  from: z.string().email('from debe ser un correo válido'),
  to: z
    .array(z.string().email('Cada destinatario debe ser un correo válido'))
    .min(1, 'Debe enviar al menos un destinatario'),
  subject: z.string().min(1, 'Asunto requerido'),
  html: z.string().min(1, 'Contenido HTML requerido'),
});


