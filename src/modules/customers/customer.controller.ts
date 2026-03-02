import { Response, NextFunction } from 'express';
import { AuthRequest, CustomerRequest } from '../../shared/middlewares';
import { customerService } from './customer.service';
import { UserRole } from '../../shared/database/models/enums';

export class CustomerController {
  public createForBusiness = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID and user are required',
          },
        });
        return;
      }

      if (![UserRole.ADMIN, UserRole.BUSINESS_OWNER].includes(req.user.role as UserRole)) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Only ADMIN or BUSINESS_OWNER can create customers',
          },
        });
        return;
      }

      const { name, phone, notes, address } = req.body as {
        name: string;
        phone: string;
        notes?: string | null;
        address?: { address: string; notes?: string | null; is_default?: boolean };
      };

      const customer = await customerService.createCustomerForBusiness(req.business_id, {
        name,
        phone,
        notes,
        address,
      });

      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByUserBusinesses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is required',
          },
        });
        return;
      }

      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const data = await customerService.getCustomersByUserBusinesses(userId, {
        id: req.user.id,
        role: req.user.role,
        businessId: req.user.business_id,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public getByUserBusinessesCsv = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is required',
          },
        });
        return;
      }

      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid user ID',
          },
        });
        return;
      }

      const data = await customerService.getCustomersByUserBusinesses(userId, {
        id: req.user.id,
        role: req.user.role,
        businessId: req.user.business_id,
      });

      const headers = ['business_id', 'customer_id', 'name', 'phone', 'notes', 'created_at'];

      const escapeCsv = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes('"') || stringValue.includes(';') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const rows = data.flatMap((group) =>
        group.customers.map((customer: any) => ({
          business_id: group.business_id,
          customer_id: customer.id,
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes ?? '',
          created_at: customer.created_at,
        }))
      );

      const csvLines = [
        headers.join(';'),
        ...rows.map((row) => headers.map((h) => escapeCsv((row as any)[h])).join(';')),
      ];

      const csv = csvLines.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customers_user_${userId}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  };

  // OTP Endpoints
  public sendOtp = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body;
      // business_id puede venir de query, body o header
      const businessId = req.business_id || parseInt(req.query.business_id as string, 10) || parseInt(req.body.business_id, 10);

      if (!phone) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Phone number is required',
          },
        });
        return;
      }

      if (!businessId || isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const result = await customerService.sendOtp(phone, businessId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, otp, code, name } = req.body;
      // Soporta tanto "otp" como "code" para compatibilidad
      const otpCode = otp || code;
      // business_id puede venir de query, body o header
      const businessId = req.business_id || parseInt(req.query.business_id as string, 10) || parseInt(req.body.business_id, 10);

      if (!phone || !otpCode) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Phone and otp are required',
          },
        });
        return;
      }

      if (!businessId || isNaN(businessId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const result = await customerService.verifyOtp(phone, otpCode, businessId, name);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Customer CRUD
  public getAll = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customers = await customerService.getAllCustomers(req.business_id);

      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer ID',
          },
        });
        return;
      }

      const customer = await customerService.getCustomerById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer ID',
          },
        });
        return;
      }

      const { name, phone, notes } = req.body;

      const customer = await customerService.updateCustomer(id, req.business_id, {
        name,
        phone,
        notes,
      });

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer ID',
          },
        });
        return;
      }

      await customerService.deleteCustomer(id, req.business_id);

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // Address CRUD
  public getAllAddresses = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customerId = parseInt(req.params.customerId, 10);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer ID',
          },
        });
        return;
      }

      const addresses = await customerService.getAllAddresses(customerId, req.business_id);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAddressById = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customerId = parseInt(req.params.customerId, 10);
      const addressId = parseInt(req.params.addressId, 10);

      if (isNaN(customerId) || isNaN(addressId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer or address ID',
          },
        });
        return;
      }

      const address = await customerService.getAddressById(addressId, customerId, req.business_id);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  };

  public createAddress = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customerId = parseInt(req.params.customerId, 10);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer ID',
          },
        });
        return;
      }

      const { address, notes, is_default } = req.body;

      if (!address) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Address is required',
          },
        });
        return;
      }

      const newAddress = await customerService.createAddress(customerId, req.business_id, {
        address,
        notes,
        is_default,
      });

      res.status(201).json({
        success: true,
        data: newAddress,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAddress = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customerId = parseInt(req.params.customerId, 10);
      const addressId = parseInt(req.params.addressId, 10);

      if (isNaN(customerId) || isNaN(addressId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer or address ID',
          },
        });
        return;
      }

      const { address, notes, is_default } = req.body;

      const updatedAddress = await customerService.updateAddress(
        addressId,
        customerId,
        req.business_id,
        {
          address,
          notes,
          is_default,
        }
      );

      res.status(200).json({
        success: true,
        data: updatedAddress,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAddressById = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const addressId = parseInt(req.params.id, 10);

      if (isNaN(addressId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid address ID',
          },
        });
        return;
      }

      const { address, notes, is_default } = req.body;

      const updatedAddress = await customerService.updateAddressById(addressId, req.business_id, {
        address,
        notes,
        is_default,
      });

      res.status(200).json({
        success: true,
        data: updatedAddress,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteAddress = async (req: CustomerRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Business ID is required',
          },
        });
        return;
      }

      const customerId = parseInt(req.params.customerId, 10);
      const addressId = parseInt(req.params.addressId, 10);

      if (isNaN(customerId) || isNaN(addressId)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid customer or address ID',
          },
        });
        return;
      }

      await customerService.deleteAddress(addressId, customerId, req.business_id);

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const customerController = new CustomerController();

