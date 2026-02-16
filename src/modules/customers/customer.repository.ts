import { Op } from 'sequelize';
import { Customer, CustomerAddress } from '../../shared/database/models';
import { AppError } from '../../shared/errors';

export class CustomerRepository {
  public async findByPhone(phone: string, businessId: number) {
    const customer = await Customer.findOne({
      where: {
        phone,
        business_id: businessId,
      },
    });

    return customer;
  }

  public async findById(id: number, businessId: number) {
    const customer = await Customer.findOne({
      where: {
        id,
        business_id: businessId,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  public async findAll(businessId: number) {
    const customers = await Customer.findAll({
      where: {
        business_id: businessId,
      },
      order: [['created_at', 'DESC']],
    });

    return customers;
  }

  public async create(data: {
    business_id: number;
    name: string;
    phone: string;
    notes?: string | null;
  }) {
    const customer = await Customer.create(data);
    return customer;
  }

  public async update(
    id: number,
    businessId: number,
    data: {
      name?: string;
      phone?: string;
      notes?: string | null;
    }
  ) {
    const customer = await this.findById(id, businessId);

    await customer.update(data);
    return customer.reload();
  }

  public async delete(id: number, businessId: number) {
    const customer = await this.findById(id, businessId);
    await customer.destroy();
  }

  // Customer Addresses
  public async findAddressById(addressId: number, customerId: number) {
    const address = await CustomerAddress.findOne({
      where: {
        id: addressId,
        customer_id: customerId,
      },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    return address;
  }

  public async findAllAddresses(customerId: number) {
    const addresses = await CustomerAddress.findAll({
      where: {
        customer_id: customerId,
      },
      order: [['is_default', 'DESC'], ['id', 'ASC']],
    });

    return addresses;
  }

  public async createAddress(data: {
    customer_id: number;
    address: string;
    notes?: string | null;
    is_default?: boolean;
  }) {
    // Si se marca como default, quitar default de otras direcciones
    if (data.is_default) {
      await CustomerAddress.update(
        { is_default: false },
        {
          where: {
            customer_id: data.customer_id,
            is_default: true,
          },
        }
      );
    }

    const address = await CustomerAddress.create(data);
    return address;
  }

  public async updateAddress(
    addressId: number,
    customerId: number,
    data: {
      address?: string;
      notes?: string | null;
      is_default?: boolean;
    }
  ) {
    const address = await this.findAddressById(addressId, customerId);

    // Si se marca como default, quitar default de otras direcciones
    if (data.is_default) {
      await CustomerAddress.update(
        { is_default: false },
        {
          where: {
            customer_id: customerId,
            is_default: true,
            id: { [Op.ne]: addressId },
          },
        }
      );
    }

    await address.update(data);
    return address.reload();
  }

  public async deleteAddress(addressId: number, customerId: number) {
    const address = await this.findAddressById(addressId, customerId);
    await address.destroy();
  }

  public async findAddressByIdOnly(addressId: number) {
    const address = await CustomerAddress.findByPk(addressId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'business_id'],
        },
      ],
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    return address;
  }
}

export const customerRepository = new CustomerRepository();

