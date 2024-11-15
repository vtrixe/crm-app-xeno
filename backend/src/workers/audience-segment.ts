import RabbitMQConfig from "@/config/rabbitmq";

class AudienceSegmentationQueue {
  static async setupQueues() {
    const channel = await RabbitMQConfig.getChannel();
    
    await channel.assertExchange('audience-segmentation', 'direct', { durable: true });
    await channel.assertQueue('segment-size-queue', { durable: true });
    await channel.assertQueue('segment-update-queue', { durable: true });
    
    await channel.bindQueue('segment-size-queue', 'audience-segmentation', 'calculate-size');
    await channel.bindQueue('segment-update-queue', 'audience-segmentation', 'segment-update');
    
    return channel;
  }
}

export default AudienceSegmentationQueue;