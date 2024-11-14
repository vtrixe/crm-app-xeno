
import express from 'express';
import DataIngestionController from '../controllers/data-ingestion';
import authorize from '../middlewares/rbac';
import { validateCustomer, validateOrder } from '../middlewares/validate';

const router = express.Router();


router.post(
  '/customers',
  authorize(['Admin', 'Manager']),
  validateCustomer,
  DataIngestionController.ingestCustomer
);

router.post(
  '/orders',
  authorize(['Admin', 'Manager']),
  validateOrder,
  DataIngestionController.ingestOrder
);

export default router;
