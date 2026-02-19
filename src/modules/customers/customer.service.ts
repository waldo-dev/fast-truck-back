import crypto from 'crypto';
import { AppError } from '../../shared/errors';
import { customerRepository } from './customer.repository';
import { otpService } from './otp.service';

export class CustomerService {
  /**
   * Genera un token de sesión temporal para el customer
   */
  private generateSessionToken(customerId: number, phone: string): string {
    const data = `${customerId}:${phone}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Envía OTP a un teléfono (mock)
   */
  public async sendOtp(phone: string, _businessId: number) {
    // Validar formato de teléfono básico
    if (!phone || phone.length < 10) {
      throw new AppError('Invalid phone number', 400);
    }

    const code = await otpService.generateOtp(phone);

    return {
      message: 'OTP sent successfully',
      // En desarrollo, retornamos el código. En producción, no se debe retornar
      ...(process.env.NODE_ENV === 'development' && { code }),
    };
  }

  /**
   * Verifica OTP y crea/obtiene customer
   */
  public async verifyOtp(phone: string, code: string, businessId: number, name?: string) {
    const isValid = await otpService.verifyOtp(phone, code);

    if (!isValid) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Buscar customer existente
    let customer = await customerRepository.findByPhone(phone, businessId);

    // Si no existe, crearlo
    if (!customer) {
      if (!name) {
        throw new AppError('Name is required for new customers', 400);
      }

      customer = await customerRepository.create({
        business_id: businessId,
        name,
        phone,
      });
    }

    // Generar token de sesión
    const sessionToken = this.generateSessionToken(customer.id, customer.phone);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        business_id: customer.business_id,
      },
      session_token: sessionToken,
    };
  }

  /**
   * Obtiene customer por ID
   */
  public async getCustomerById(id: number, businessId: number) {
    const customer = await customerRepository.findById(id, businessId);
    return customer;
  }

  /**
   * Obtiene todos los customers
   */
  public async getAllCustomers(businessId: number) {
    const customers = await customerRepository.findAll(businessId);
    return customers;
  }

  /**
   * Actualiza customer
   */
  public async updateCustomer(
    id: number,
    businessId: number,
    data: {
      name?: string;
      phone?: string;
      notes?: string | null;
    }
  ) {
    const customer = await customerRepository.update(id, businessId, data);
    return customer;
  }

  /**
   * Elimina customer
   */
  public async deleteCustomer(id: number, businessId: number) {
    await customerRepository.delete(id, businessId);
  }

  // Customer Addresses
  public async getAllAddresses(customerId: number, businessId: number) {
    // Verificar que el customer pertenezca al business
    await customerRepository.findById(customerId, businessId);

    const addresses = await customerRepository.findAllAddresses(customerId);
    return addresses;
  }

  public async getAddressById(addressId: number, customerId: number, businessId: number) {
    // Verificar que el customer pertenezca al business
    await customerRepository.findById(customerId, businessId);

    const address = await customerRepository.findAddressById(addressId, customerId);
    return address;
  }

  public async createAddress(
    customerId: number,
    businessId: number,
    data: {
      address: string;
      notes?: string | null;
      is_default?: boolean;
    }
  ) {
    // Verificar que el customer pertenezca al business
    await customerRepository.findById(customerId, businessId);

    const address = await customerRepository.createAddress({
      customer_id: customerId,
      ...data,
    });
    return address;
  }

  public async updateAddress(
    addressId: number,
    customerId: number,
    businessId: number,
    data: {
      address?: string;
      notes?: string | null;
      is_default?: boolean;
    }
  ) {
    // Verificar que el customer pertenezca al business
    await customerRepository.findById(customerId, businessId);

    const address = await customerRepository.updateAddress(addressId, customerId, data);
    return address;
  }

  public async deleteAddress(addressId: number, customerId: number, businessId: number) {
    // Verificar que el customer pertenezca al business
    await customerRepository.findById(customerId, businessId);

    await customerRepository.deleteAddress(addressId, customerId);
  }

  public async updateAddressById(
    addressId: number,
    businessId: number,
    data: {
      address?: string;
      notes?: string | null;
      is_default?: boolean;
    }
  ) {
    const address = await customerRepository.findAddressByIdOnly(addressId);
    const customer = (address as any).customer;

    if (!customer || customer.business_id !== businessId) {
      throw new AppError('Address does not belong to this business', 403);
    }

    return await customerRepository.updateAddress(addressId, customer.id, data);
  }
}

export const customerService = new CustomerService();

