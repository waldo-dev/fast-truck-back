import { Op } from 'sequelize';
import { Otp } from '../../shared/database/models';
import { AppError } from '../../shared/errors';
import { generateOtp, getOtpExpiration, isOtpExpired } from '../../shared/utils/otp';
import { logger } from '../../shared/utils';

export class OtpService {
  /**
   * Genera y guarda un OTP para un teléfono
   */
  public async generateOtp(phone: string): Promise<string> {
    // Invalidar OTPs anteriores no verificados del mismo teléfono
    await Otp.update(
      { verified: true },
      {
        where: {
          phone,
          verified: false,
          expires_at: { [Op.gt]: new Date() },
        },
      }
    );

    const code = generateOtp();
    const expiresAt = getOtpExpiration(10); // 10 minutos

    await Otp.create({
      phone,
      code,
      expires_at: expiresAt,
      verified: false,
    });

    // En producción, aquí se enviaría el SMS
    // Por ahora, solo logueamos (mock)
    logger.info(`OTP generated for ${phone}: ${code} (expires at ${expiresAt.toISOString()})`);

    return code;
  }

  /**
   * Verifica un OTP
   */
  public async verifyOtp(phone: string, code: string): Promise<boolean> {
    const otp = await Otp.findOne({
      where: {
        phone,
        code,
        verified: false,
      },
      order: [['created_at', 'DESC']],
    });

    if (!otp) {
      return false;
    }

    if (isOtpExpired(otp.expires_at)) {
      await otp.update({ verified: true }); // Marcar como usado aunque haya expirado
      return false;
    }

    // Marcar como verificado
    await otp.update({ verified: true });

    return true;
  }

  /**
   * Limpia OTPs expirados (tarea de limpieza)
   */
  public async cleanupExpiredOtps(): Promise<void> {
    await Otp.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() },
      },
    });
  }
}

export const otpService = new OtpService();

