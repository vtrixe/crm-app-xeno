import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export default class DataConsumer {
  static async initialize() {
    const channel = await RabbitMQConfig.getChannel();
    const redis = RedisConfig.getClient();

    channel.consume('customer-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());

       
        const customerData = {
          name: data.name,
          email: data.email,
          phone: data.phone ? data.phone : undefined, 
          createdAt: new Date(),
        };

        try {
          await prisma.customer.create({
            data: customerData,
          });
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing customer data:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    channel.consume('order-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());
        const orderData = {
          customerId: data.customerId,
          amount: data.amount,
          status: data.status,
          createdAt: new Date(),
        };

        try {
          await prisma.order.create({
            data: orderData,
          });
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing order data:', error);
          channel.nack(msg, false, true); 
        }
      }
    });
  }
}
