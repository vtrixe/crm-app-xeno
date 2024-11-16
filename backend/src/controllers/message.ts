import { Request, Response } from 'express';
import MessageSendingService from '@/services/messaage';
export default class MessageController {
  static async sendMessage(req: Request, res: Response) {
    try {
      const { campaignId, customerId, messageContent } = req.body;
      await MessageSendingService.publishMessage(campaignId, customerId, messageContent);
      res.status(202).json({ message: 'Message accepted for processing' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      const { id, deliveryStatus } = req.body;
      await MessageSendingService.updateMessageDeliveryStatus(id, deliveryStatus);
      res.status(200).json({ message: 'Delivery status updated' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async getCampaignStats(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;
      const stats = await MessageSendingService.getCampaignStats(Number(campaignId));
      res.status(200).json({ message: 'Campaign stats fetched successfully', stats });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}