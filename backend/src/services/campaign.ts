// services/campaign.ts

import { PrismaClient, Campaign, CampaignStatus } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

interface CreateCampaignDTO {
  name: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  targetAudience: string;
  messageTemplate: string;
}

export default class CampaignService {
  static async createCampaign(campaignData: CreateCampaignDTO, userId: number) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();

    // Create campaign in DB
    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        status: CampaignStatus.DRAFT,
        createdBy: userId,
        updatedBy: userId
      }
    });

    // Cache campaign data
    const key = `campaign:${campaign.id}`;
    await redis.set(key, JSON.stringify(campaign), { EX: 3600 });

    // Publish to queue for async processing
    await channel.publish(
      'campaign-exchange',
      'campaign.create',
      Buffer.from(JSON.stringify({ key, data: campaign }))
    );

    return campaign;
  }

  static async getCampaign(id: number) {
    const redis = RedisConfig.getClient();
    
    // Try cache first
    const cached = await redis.get(`campaign:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from DB with stats
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        stats: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (campaign) {
      await redis.set(`campaign:${id}`, JSON.stringify(campaign), { EX: 3600 });
    }

    return campaign;
  }

  static async updateCampaignStats(campaignId: number, stats: any) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();

    const key = `campaign-stats:${campaignId}:${Date.now()}`;
    await redis.set(key, JSON.stringify(stats), { EX: 3600 });

    await channel.publish(
      'campaign-exchange',
      'campaign.stats',
      Buffer.from(JSON.stringify({ key, campaignId, stats }))
    );
  }
}