import express from 'express';
import MetricsController from '@/controllers/metrics';

const router = express.Router();

router.get('/customer', MetricsController.getCustomerMetrics);
router.get('/order', MetricsController.getOrderMetrics);
router.post('/calculate/:type', MetricsController.calculateMetrics);

export default router;