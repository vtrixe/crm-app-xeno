import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export default class DataIngestionService {
  static async publishCustomer(customerData: any) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();
    
    const key = `customer:${Date.now()}`;
    await redis.set(key, JSON.stringify(customerData), { EX: 3600 });
    
    await channel.publish(
      'data-ingestion',
      'customer',
      Buffer.from(JSON.stringify({ key, data: customerData }))
    );
  }

  static async publishOrder(orderData: any) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();
    
    const key = `order:${Date.now()}`;
    await redis.set(key, JSON.stringify(orderData), { EX: 3600 });
    
    await channel.publish(
      'data-ingestion',
      'order',
      Buffer.from(JSON.stringify({ key, data: orderData }))
    );
  }
}