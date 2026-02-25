import { Response, NextFunction } from 'express';
import { bucket } from '../../config/firebase';
import { AppError } from '../../shared/errors';
import { AuthRequest } from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { businessService } from './business.service';

type FileAuthRequest = AuthRequest & { file?: Express.Multer.File };

export class BusinessController {
  public getAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }

      const business =
        req.user.role === UserRole.ADMIN
        ? await businessService.getAllBusinessesAdmin()
        : await businessService.getBusinessesForUser(req.user.id);

      res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const business = await businessService.getBusinessById(id, req.business_id);

      res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  private async uploadLogoOrFail(file: Express.Multer.File, businessId: number): Promise<string> {
    if (!file) {
      throw new AppError('Logo file is required', 400);
    }

    const objectName = `business/${businessId}/${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(objectName);

    await fileRef.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      public: true,
      resumable: false,
    });

    return fileRef.publicUrl();
  }

  public create = async (req: FileAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Unauthorized',
          },
        });
        return;
      }

      const { name, brand_name, primary_color, secondary_color } = req.body;
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { message: 'Logo file is required' },
        });
        return;
      }

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Name is required',
          },
        });
        return;
      }

      // Crear el business primero, luego subir el logo usando su ID
      const business = await businessService.createBusiness(
        {
          name,
          brand_name: brand_name || null,
          logo_url: null,
          primary_color: primary_color || null,
          secondary_color: secondary_color || null,
        },
        req.user.role as UserRole,
        req.user.id
      );

      const logoUrl = await this.uploadLogoOrFail(file, business.id);
      await business.update({ logo_url: logoUrl });
      const businessWithLogo = await business.reload();

      res.status(201).json({
        success: true,
        data: businessWithLogo,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: FileAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      const { name, brand_name, primary_color, secondary_color } = req.body;
      const file = req.file;

      let logoUrl: string | undefined;
      if (file) {
        logoUrl = await this.uploadLogoOrFail(file, id);
      }

      const business = await businessService.updateBusiness(
        id,
        req.business_id,
        {
          name,
          brand_name,
          ...(logoUrl ? { logo_url: logoUrl } : {}),
          primary_color,
          secondary_color,
        },
        req.user.role as UserRole
      );

      res.status(200).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.business_id || !req.user) {
        res.status(403).json({
          success: false,
          error: {
            message: 'User is not associated with a business',
          },
        });
        return;
      }

      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid business ID',
          },
        });
        return;
      }

      await businessService.deleteBusiness(id, req.business_id, req.user.role as UserRole);

      res.status(200).json({
        success: true,
        message: 'Business deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const businessController = new BusinessController();

