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
    await redis.set(redisKey, JSON.stringify(messageData), { EX: 3600 });

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