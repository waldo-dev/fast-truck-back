/**
 * Genera un código OTP numérico de 6 dígitos
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calcula la fecha de expiración del OTP (por defecto 10 minutos)
 */
export const getOtpExpiration = (minutes: number = 10): Date => {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + minutes);
  return expiration;
};

/**
 * Verifica si un OTP ha expirado
 */
export const isOtpExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};


