import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';
import MessageSendingService from '@/services/messaage';
const prisma = new PrismaClient();

export default class MessageConsumer {
  static async initialize() {
    const channel = await RabbitMQConfig.getChannel();
    const redis = RedisConfig.getClient();

    channel.consume('message-queue', async (msg) => {
      if (msg) {
        const { redisKey, data } = JSON.parse(msg.content.toString());

        try {
          // Process the message
          await MessageSendingService.publishMessage(
            data.campaignId,
            data.customerId,
            data.content
          );

          // Remove the message from Redis
          await redis.del(redisKey);

          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          channel.nack(msg, false, true);
        }
      }
    });
  }
}