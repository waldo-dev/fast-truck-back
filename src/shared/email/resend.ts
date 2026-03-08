import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  // No lanzar error aquí para no romper el bootstrap; fallará al enviar si falta.
  console.warn('RESEND_API_KEY no está configurado.');
}

export const resendClient = new Resend(process.env.RESEND_API_KEY || '');




