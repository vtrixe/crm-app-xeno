import { Request, Response, NextFunction } from 'express';
import CampaignService from '../services/campaign';
import { CreateCampaignDTO } from '../types/campaign';

export default class CampaignController {
  static async createCampaign(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignData: CreateCampaignDTO = req.body;
      const userId = (req.user as any).id;
      
      const campaign = await CampaignService.createCampaign(campaignData, userId);
      res.status(201).json(campaign);
    } catch (error) {
      next(error);
    }
  }

  static async getCampaign(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await CampaignService.getCampaign(campaignId);
      
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }
      
      res.json(campaign);
    } catch (error) {
      next(error);
    }
  }

  static async updateCampaignStats(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const stats = req.body;
      
      await CampaignService.updateCampaignStats(campaignId, stats);
      res.status(200).json({ message: 'Campaign stats updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCampaign(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      // Add delete method to service and call it here
      // await CampaignService.deleteCampaign(campaignId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
