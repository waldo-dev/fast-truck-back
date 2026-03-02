import crypto from 'crypto';
import { AppError } from '../../shared/errors';
import { UserRole } from '../../shared/database/models/enums';
import { UserBusiness } from '../../shared/database/models';
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

  public async createCustomerForBusiness(businessId: number, data: { name: string; phone: string; notes?: string | null; address?: { address: string; notes?: string | null; is_default?: boolean } }) {
    const existing = await customerRepository.findByPhone(data.phone, businessId);
    if (existing) {
      throw new AppError('Customer with this phone already exists in this business', 400);
    }

    const customer = await customerRepository.create({
      business_id: businessId,
      name: data.name,
      phone: data.phone,
      notes: data.notes ?? null,
    });

    if (data.address) {
      await customerRepository.createAddress({
        customer_id: customer.id,
        address: data.address.address,
        notes: data.address.notes ?? null,
        is_default: data.address.is_default ?? true,
      });
    }

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

  public async getCustomersByUserBusinesses(
    targetUserId: number,
    requester: { id: number; role: UserRole; businessId?: number | null }
  ) {
    const isSelf = requester.id === targetUserId;
    const isAdminOrOwner = [UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(requester.role);

    if (!isSelf && !isAdminOrOwner) {
      throw new AppError('Not authorized to view customers for this user', 403);
    }

    const links = await UserBusiness.findAll({
      where: { user_id: targetUserId },
      attributes: ['business_id'],
    });

    const businessIds = new Set<number>();
    if (requester.businessId) {
      businessIds.add(requester.businessId);
    }
    for (const link of links) {
      if (link.business_id) {
        businessIds.add(link.business_id);
      }
    }

    if (businessIds.size === 0) {
      return [];
    }

    const grouped = [];
    for (const businessId of businessIds) {
      const customers = await customerRepository.findAllWithOrders(businessId);
      grouped.push({ business_id: businessId, customers });
    }

    return grouped;
  }
}

export const customerService = new CustomerService();

