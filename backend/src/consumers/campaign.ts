// consumers/campaign.ts

import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export default class CampaignConsumer {
  static async initialize() {
    const channel = await RabbitMQConfig.getChannel();
    const redis = RedisConfig.getClient();

    // Handle new campaign creation
    channel.consume('campaign-creation-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());
        
        try {
          // Initialize campaign stats
          await prisma.campaignStats.create({
            data: {
              campaignId: data.id,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              cost: 0
            }
          });
          
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing campaign creation:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    // Handle campaign stats updates
    channel.consume('campaign-stats-queue', async (msg) => {
      if (msg) {
        const { key, campaignId, stats } = JSON.parse(msg.content.toString());
        
        try {
          await prisma.campaignStats.create({
            data: {
              campaignId,
              ...stats
            }
          });
          
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing campaign stats:', error);
          channel.nack(msg, false, true);
        }
      }
    });
  }
}