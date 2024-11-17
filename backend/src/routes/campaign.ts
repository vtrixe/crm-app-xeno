import express from 'express';
import CampaignController from '../controllers/campaign';
import authorize from '../middlewares/rbac';
import { 
  validateCampaign, 
  validateCampaignStats, 
} from '../middlewares/validate';

const router = express.Router();

// Create campaign - Admin and Manager only
router.post(
  '/',
  authorize(['Admin', 'Manager']),
  validateCampaign,
  CampaignController.createCampaign
);

// List campaigns - All authenticated users
router.get(
  '/',
  authorize(['Admin', 'Manager', 'Analyst', 'Viewer']),
  CampaignController.listCampaigns
);

// Get specific campaign - All authenticated users
router.get(
  '/:id',
  authorize(['Admin', 'Manager', 'Analyst', 'Viewer']),
  CampaignController.getCampaign
);

// Update campaign - Admin and Manager only
router.put(
  '/:id',
  authorize(['Admin', 'Manager']),
  CampaignController.updateCampaign
);

// Update campaign status - Admin and Manager only
router.patch(
  '/:id/status',
  authorize(['Admin', 'Manager']),
  CampaignController.updateCampaign
);

// Update campaign stats - Admin and Manager only
router.put(
  '/:id/stats',
  authorize(['Admin', 'Manager']),
  validateCampaignStats,
  CampaignController.updateCampaignStats
);

// Delete campaign - Admin only
router.delete(
  '/:id',
  authorize(['Admin']),
  CampaignController.deleteCampaign
);

export default router;