import express from 'express';
import MessageController from '@/controllers/message';
import authorize from '../middlewares/rbac';

const router = express.Router();

router.post(
  '/send',
  authorize(['Admin', 'Manager']),
  MessageController.sendMessage
);

router.post(
  '/delivery-status',
  authorize(['Admin', 'Manager']),
  MessageController.updateDeliveryStatus
);

router.get(
  '/campaign/:campaignId/stats',
  authorize(['Admin', 'Manager']),
  MessageController.getCampaignStats
);


export default router;