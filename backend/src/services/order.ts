import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export class OrderService {
    static async getAllOrders(page: number, limit: number) {
      const skip = (page - 1) * limit;
      return prisma.order.findMany({
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
    }
  
    static async getOrder(id: number) {
      return prisma.order.findUnique({
        where: { id },
        include: {
          customer: true
        }
      });
    }
  
    static async publishMetricsCalculation(type: 'customer' | 'order') {
      const channel = await RabbitMQConfig.getChannel();
      await channel.publish(
        'metrics-exchange',
        `${type}.metrics`,
        Buffer.from(JSON.stringify({ timestamp: Date.now() }))
      );
    }
    
  
    static async publishOrderUpdate(orderData: any) {
      const redis = RedisConfig.getClient();
      const channel = await RabbitMQConfig.getChannel();
      
      const key = `order-update:${Date.now()}`;
      await redis.setex(key, 3600, JSON.stringify(orderData));
      
      await channel.publish(
        'data-ingestion',  // Changed from 'data-processing' to 'data-ingestion'
        'order.update',
        Buffer.from(JSON.stringify({ key, data: orderData }))
      );
    }
    
    static async publishOrderDeletion(orderId: number) {
      const channel = await RabbitMQConfig.getChannel();
      await channel.publish(
        'data-ingestion',  // Changed from 'data-processing' to 'data-ingestion'
        'order.delete',
        Buffer.from(JSON.stringify({ id: orderId }))
      );
    }
  }