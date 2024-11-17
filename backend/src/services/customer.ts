import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export class CustomerService {
  static async getAllCustomers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    return prisma.customer.findMany({
      skip,
      take: limit,
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
  }

  static async getCustomer(id: number) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: true,
        _count: {
          select: { orders: true }
        }
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
  
  static async publishCustomerUpdate(customerData: any) {
    const redis = RedisConfig.getClient();
    const channel = await RabbitMQConfig.getChannel();
    
    const key = `customer-update:${Date.now()}`;
    await redis.setex(key, 3600, JSON.stringify(customerData));
    
    await channel.publish(
      'data-ingestion',  // Changed from 'data-processing' to 'data-ingestion'
      'customer.update',
      Buffer.from(JSON.stringify({ key, data: customerData }))
    );
  }
  static async publishCustomerDeletion(customerId: number) {
    try {
      // Check if the customer exists in the database
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        console.log(`Customer with id ${customerId} does not exist. Skipping publishing deletion.`);
        return; // Skip the publishing if the customer doesn't exist
      }

      // If customer exists, proceed to publish the message to RabbitMQ
      const channel = await RabbitMQConfig.getChannel();
      await channel.publish(
        'data-ingestion',  // Changed from 'data-processing' to 'data-ingestion'
        'customer.delete',
        Buffer.from(JSON.stringify({ id: customerId }))
      );

      console.log(`Deletion message for customer ${customerId} published successfully.`);
    } catch (error) {
      console.error('Error publishing customer deletion:', error);
    }
  }
}