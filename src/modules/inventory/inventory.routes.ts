import { Router } from 'express';
import {
  authenticate,
  injectBusinessId,
  authorize,
  validate,
  validateParams,
  validateQuery,
  demoReadOnlyGuard,
} from '../../shared/middlewares';
import { UserRole } from '../../shared/database/models/enums';
import { inventoryController } from './inventory.controller';
import {
  listItemsQuerySchema,
  createItemSchema,
  updateItemSchema,
  paramsIdSchema,
  paramsMovementSchema,
  createMovementSchema,
  setRecipesSchema,
  paramsProductSchema,
  paramsOptionSchema,
} from './inventory.schemas';
import multer from 'multer';
import { inventoryImportController } from './inventory-import.controller';

const router = Router();
const upload = multer();

router.use(authenticate);
router.use(injectBusinessId);

// Items
router.get('/inventory/items', validateQuery(listItemsQuerySchema), inventoryController.listItems);
router.post(
  '/inventory/items',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validate(createItemSchema),
  inventoryController.createItem
);
router.patch(
  '/inventory/items/:id',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validateParams(paramsIdSchema),
  validate(updateItemSchema),
  inventoryController.updateItem
);

// Movements
router.get(
  '/inventory/items/:itemId/movements',
  validateParams(paramsMovementSchema),
  inventoryController.listMovements
);
router.post(
  '/inventory/movements',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validate(createMovementSchema),
  inventoryController.createMovement
);

// Recipes for products
router.get(
  '/inventory/products/:id/recipes',
  validateParams(paramsProductSchema),
  inventoryController.getProductRecipes
);
router.post(
  '/inventory/products/:id/recipes',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validateParams(paramsProductSchema),
  validate(setRecipesSchema),
  inventoryController.setProductRecipes
);

// Recipes for product options
router.get(
  '/inventory/product-options/:optionId/recipes',
  validateParams(paramsOptionSchema),
  inventoryController.getOptionRecipes
);
router.post(
  '/inventory/product-options/:optionId/recipes',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  validateParams(paramsOptionSchema),
  validate(setRecipesSchema),
  inventoryController.setOptionRecipes
);

// Import recipes from Excel
router.post(
  '/inventory/recipes/import',
  authorize(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.LOCAL_OPERATOR),
  demoReadOnlyGuard,
  upload.single('file'),
  inventoryImportController.importRecipes
);

export default router;


