import { PrismaClient, Campaign, Prisma } from '@prisma/client';
import { Channel, ConsumeMessage } from 'amqplib';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

interface CampaignMessage {
  key: string;
  data: Campaign;
}

interface CampaignStatsMessage {
  key: string;
  campaignId: number;
  stats: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    cost?: number;
    ctr?: number;
    cpc?: number;
    cpa?: number;
    roi?: number;
  };
}

interface CampaignDeleteMessage {
  campaignId: number;
  userId: number;
  previousData: Campaign;
}

export default class CampaignConsumer {
  private static async handleError(channel: Channel, msg: ConsumeMessage, error: any) {
    console.error('Campaign consumer error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Permanent failure - reject message
      channel.reject(msg, false);
    } else {
      // Temporary failure - requeue message
      channel.nack(msg, false, true);
    }
  }

  static async initialize() {
    const channel = await RabbitMQConfig.getChannel();
    const redis = RedisConfig.getClient();

    // Set up exchange
    await channel.assertExchange('campaign-exchange', 'topic', { durable: true });

    // Set up queues
    await channel.assertQueue('campaign.create', { durable: true });
    await channel.assertQueue('campaign.update', { durable: true });
    await channel.assertQueue('campaign.delete', { durable: true });
    await channel.assertQueue('campaign.stats', { durable: true });

    // Bind queues to exchange
    await channel.bindQueue('campaign.create', 'campaign-exchange', 'campaign.create');
    await channel.bindQueue('campaign.update', 'campaign-exchange', 'campaign.update');
    await channel.bindQueue('campaign.delete', 'campaign-exchange', 'campaign.delete');
    await channel.bindQueue('campaign.stats', 'campaign-exchange', 'campaign.stats');

    // Handle campaign creation
    channel.consume('campaign.create', async (msg) => {
      if (!msg) return;

      try {
        const { key, data }: CampaignMessage = JSON.parse(msg.content.toString());

        // Initialize campaign stats
        await prisma.campaignStats.create({
          data: {
            campaignId: data.id,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            cost: 0,
            ctr: 0,
            cpc: 0,
            cpa: 0,
            roi: 0,
          },
        });

        // Create initial history entry
        await prisma.campaignHistory.create({
          data: {
            campaignId: data.id,
            action: 'CREATE',
            oldValue: '',
            newValue: JSON.stringify(data),
            updatedBy: data.createdBy,
          },
        });

        await redis.del(key);
        channel.ack(msg);
      } catch (error) {
        await this.handleError(channel, msg, error);
      }
    });

    // Handle campaign updates
    channel.consume('campaign.update', async (msg) => {
      if (!msg) return;

      try {
        const { key, data }: CampaignMessage = JSON.parse(msg.content.toString());

        // Cache updated campaign data
        await redis.setex(key, 3600, JSON.stringify(data));
        channel.ack(msg);
      } catch (error) {
        await this.handleError(channel, msg, error);
      }
    });

    // Handle campaign stats updates
    channel.consume('campaign.stats', async (msg) => {
      if (!msg) return;

      try {
        const { key, campaignId, stats }: CampaignStatsMessage = JSON.parse(msg.content.toString());

        // Create new stats entry
        const campaignStats = await prisma.campaignStats.create({
          data: {
            campaignId,
            ...stats,
          },
        });

        // Cache stats
        await redis.setex(key, 3600, JSON.stringify(campaignStats));
        channel.ack(msg);
      } catch (error) {
        await this.handleError(channel, msg, error);
      }
    });

    // Handle campaign deletion
    channel.consume('campaign.delete', async (msg) => {
      if (!msg) return;

      try {
        const { campaignId, userId, previousData }: CampaignDeleteMessage = JSON.parse(msg.content.toString());

        // Create final history entry before deletion
        await prisma.campaignHistory.create({
          data: {
            campaignId,
            action: 'DELETE',
            oldValue: JSON.stringify(previousData),
            newValue: '',
            updatedBy: userId,
          },
        });

        // Clear campaign cache
        await redis.del(`campaign:${campaignId}`);
        channel.ack(msg);
      } catch (error) {
        await this.handleError(channel, msg, error);
      }
    });

    console.log('Campaign consumer initialized successfully');
  }
}
