import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export default class MessageSendingService {
  static async publishMessage(campaignId: number, customerId: number, messageContent: string) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();

    const messageData = {
      campaignId,
      customerId,
      content: messageContent,
      status: 'PENDING' as 'PENDING',
      createdAt: new Date(),
    };

    // Publish message to Redis
    const redisKey = `message:${Date.now()}`;
    await redis.setex(redisKey, 3600, JSON.stringify(messageData));

    // Publish message to RabbitMQ
    await channel.publish(
      'message-exchange',
      'message.send',
      Buffer.from(JSON.stringify({ redisKey, data: messageData }))
    );

    // Create message record in the database
    await prisma.message.create({
      data: {
        campaignId,
        customerId,
        content: messageContent,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });
  }

  static getRandomDeliveryStatus(): 'SENT' | 'FAILED' {
    // 90% chance of being 'SENT' and 10% chance of being 'FAILED'
    return Math.random() < 0.9 ? 'SENT' : 'FAILED';
  }

  static async getCampaignStats(campaignId: number) {
    // Count the number of messages by status for the given campaign
    const stats = await prisma.message.groupBy({
      by: ['status'],
      where: {
        campaignId,
      },
      _count: {
        status: true,
      },
    });

    const statsMap: { [key: string]: number } = {
      SENT: 0,
      FAILED: 0,
      PENDING: 0,
    };

    // Populate the stats map with the counts
    stats.forEach((stat) => {
      statsMap[stat.status] = stat._count.status;
    });

    return statsMap; // Example: { SENT: 120, FAILED: 10, PENDING: 50 }
  }

  static async updateMessageDeliveryStatus(id: number, deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED') {
    await prisma.message.update({
      where: {
        id,
      },
      data: {
        status: deliveryStatus,
        deliveredAt: deliveryStatus === 'DELIVERED' ? new Date() : null,
      },
    });
  }
}