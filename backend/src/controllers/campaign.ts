import { Request, Response, NextFunction } from 'express';
import { CampaignStatus } from '@prisma/client';
import CampaignService from '../services/campaign';
// DTOs
interface CreateCampaignDTO {
  name: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  targetAudience: string;
  messageTemplate: string;
  audienceSegmentIds: number[];
}

interface UpdateCampaignDTO extends Partial<CreateCampaignDTO> {
  status?: CampaignStatus;
}

interface CampaignStatsDTO {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  cost?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roi?: number;
}

interface ListCampaignFilters {
  status?: CampaignStatus;
  createdBy?: number;
  startDate?: Date;
  endDate?: Date;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
}

export default class CampaignController {
  static async createCampaign(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignData: CreateCampaignDTO = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      const userId = (req.user as any).id;

      const campaign = await CampaignService.createCampaign(campaignData, userId);
      res.status(201).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
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

      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      next(error);
    }
  }

  static async updateCampaign(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const updateData: UpdateCampaignDTO = {
        ...req.body,
        ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
        ...(req.body.endDate && { endDate: new Date(req.body.endDate) })
      };

      const campaign = await CampaignService.updateCampaign(campaignId, updateData, userId);
      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
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
      const stats: CampaignStatsDTO = req.body;

      const updatedStats = await CampaignService.updateCampaignStats(campaignId, stats);
      res.json({
        success: true,
        data: updatedStats
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
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

      await CampaignService.deleteCampaign(campaignId, userId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: error.message
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      next(error);
    }
  }

  static async listCampaigns(
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: ListCampaignFilters = {};
      const pagination: PaginationQuery = {};

      // Parse filters
      if (req.query.status) {
        filters.status = req.query.status as CampaignStatus;
      }
      if (req.query.createdBy) {
        filters.createdBy = parseInt(req.query.createdBy as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Parse pagination
      if (req.query.page) {
        pagination.page = parseInt(req.query.page as string);
      }
      if (req.query.limit) {
        pagination.limit = parseInt(req.query.limit as string);
      }

      const campaigns = await CampaignService.listCampaigns(filters, pagination);
      res.json({
        success: true,
        data: campaigns.data,
        pagination: campaigns.pagination
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      next(error);
    }
  }
}