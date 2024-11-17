import { Request, Response } from 'express';
import MessageSendingService from '@/services/messaage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

  static async listMessages(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      if (status && ['PENDING', 'SENT', 'DELIVERED', 'FAILED'].includes(status)) {
        where.status = status;
      }
      
      // Get messages with pagination
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          skip,
          take: limit,
          where,
          select: {
            id: true,
            content: true,
            campaignId: true,
            customerId: true,
            status: true,
            createdAt: true,
            sentAt: true,
            deliveredAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.message.count({ where })
      ]);
      
      res.status(200).json({
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}