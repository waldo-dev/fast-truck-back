import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { UserBusiness } from '../database/models';
import { UserRole } from '../database/models/enums';
import { AppError } from '../errors';

export async function assertBusinessAccess(
  req: AuthRequest,
  businessId: number
): Promise<void> {
  if (!req.user) throw new AppError('Authentication required', 401);
  if (!Number.isSafeInteger(businessId) || businessId <= 0)
    throw new AppError('Invalid business ID', 400);
  if (req.user.role === UserRole.ADMIN || req.user.business_id === businessId)
    return;
  const membership = await UserBusiness.findOne({
    where: { user_id: req.user.id, business_id: businessId },
  });
  if (!membership) throw new AppError('Business not found', 404);
}

/** Never trust a business selected in a query, request body or browser storage. */
export async function resolveBusinessScope(req: AuthRequest): Promise<void> {
  const values = [
    req.headers['x-business-id'],
    req.query.business_id,
    req.query.businessId,
    req.body?.business_id,
    req.body?.businessId,
  ].filter(value => value !== undefined && value !== null && value !== '');
  const ids = values.map(value => {
    if (typeof value !== 'string' && typeof value !== 'number')
      throw new AppError('Invalid business ID', 400);
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new AppError('Invalid business ID', 400);
    return id;
  });
  if (new Set(ids).size > 1)
    throw new AppError('Conflicting business IDs', 400);
  const businessId = ids[0] ?? req.user?.business_id;
  if (businessId) {
    await assertBusinessAccess(req, businessId);
    req.business_id = businessId;
  }
}

/** Protect object IDs too: authentication alone does not authorize access to an order or cash register. */
export const protectResource =
  (
    loadBusinessId: (
      id: number,
      req: AuthRequest
    ) => Promise<number | null | undefined>
  ) =>
  async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
    rawId: string
  ): Promise<void> => {
    try {
      const id = Number(rawId);
      if (!Number.isSafeInteger(id) || id <= 0)
        throw new AppError('Invalid resource ID', 400);
      const businessId = await loadBusinessId(id, req);
      if (!businessId || (req.business_id && req.business_id !== businessId))
        throw new AppError('Resource not found', 404);
      await assertBusinessAccess(req, businessId);
      req.business_id = businessId;
      next();
    } catch (error) {
      next(error);
    }
  };
