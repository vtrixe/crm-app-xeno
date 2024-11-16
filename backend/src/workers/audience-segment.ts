import RabbitMQConfig from "@/config/rabbitmq";
import RedisConfig from "@/config/redis";
import { AudienceSegmentationService } from "@/services/audience-segmentation";
import { PrismaClient } from "@prisma/client";

const prisma= new PrismaClient();

const redis= RedisConfig.getClient();

class AudienceSegmentationQueue {
  static async setupQueues() {
    const channel = await RabbitMQConfig.getChannel();
    const service = new AudienceSegmentationService(prisma, redis, channel);
    
    channel.consume("segment-size-queue", async (msg) => {
      if (!msg) return;
    
      const { segmentId } = JSON.parse(msg.content.toString());
      try {
        await service.calculateSegmentSize(segmentId);
        channel.ack(msg);
      } catch (error) {
        console.error(`Error calculating size for segment ${segmentId}:`, error);
        channel.nack(msg);
      }
    });
    await channel.assertExchange('audience-segmentation', 'direct', { durable: true });
    await channel.assertQueue('segment-size-queue', { durable: true });
    await channel.assertQueue('segment-update-queue', { durable: true });
    
    await channel.bindQueue('segment-size-queue', 'audience-segmentation', 'calculate-size');
    await channel.bindQueue('segment-update-queue', 'audience-segmentation', 'segment-update');
    
    return channel;
  }
}

export default AudienceSegmentationQueue;