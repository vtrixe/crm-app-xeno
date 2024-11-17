import express from 'express';
import DataIngestionController from '../controllers/data-ingestion';
import CustomerController from '@/controllers/customer';
import OrderController from '@/controllers/order';
import authorize from '../middlewares/rbac';
import { validateCustomer, validateOrder } from '../middlewares/validate';

const router = express.Router();

// Existing ingestion routes
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

// New Customer routes
router.get(
  '/customers',
  authorize(['Admin', 'Manager', 'Viewer']),
  CustomerController.getAllCustomers
);

router.get(
  '/customers/metrics',
  authorize(['Admin', 'Manager']),
  CustomerController.getCustomerMetrics
);

router.get(
  '/customers/:id',
  authorize(['Admin', 'Manager', 'Viewer']),
  CustomerController.getCustomer
);

router.put(
  '/customers/:id',
  authorize(['Admin', 'Manager']),

  CustomerController.updateCustomer
);

router.delete(
  '/customers/:id',
  authorize(['Admin']),
  CustomerController.deleteCustomer
);

// New Order routes
router.get(
  '/orders',
  authorize(['Admin', 'Manager', 'Viewer']),
  OrderController.getAllOrders
);

router.get(
  '/orders/metrics',
  authorize(['Admin', 'Manager']),
  OrderController.getOrderMetrics
);

router.get(
  '/orders/:id',
  authorize(['Admin', 'Manager', 'Viewer']),
  OrderController.getOrder
);

router.put(
  '/orders/:id',
  authorize(['Admin', 'Manager']),

  OrderController.updateOrder
);

router.delete(
  '/orders/:id',
  authorize(['Admin']),
  OrderController.deleteOrder
);

export default router;