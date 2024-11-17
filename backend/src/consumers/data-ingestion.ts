import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';

const prisma = new PrismaClient();

export default class DataConsumer {
  static async initialize() {
    const channel = await RabbitMQConfig.getChannel();
    const redis = RedisConfig.getClient();

    // Original customer and order consumers
    channel.consume('customer-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());
        const customerData = {
          name: data.name,
          email: data.email,
          phone: data.phone ? data.phone : undefined,
          totalSpending: 0,
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
          channel.nack(msg, false, false);
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
          await prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
              data: orderData,
            });

            if (createdOrder.status === 'COMPLETED') {
              await tx.customer.update({
                where: {
                  id: createdOrder.customerId,
                },
                data: {
                  totalSpending: {
                    increment: createdOrder.amount,
                  },
                  lastOrderDate: createdOrder.createdAt,
                },
              });
            }
          });
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing order data:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    // Update and delete consumers (from previous implementation)
    channel.consume('customer-update-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());
        try {
          await prisma.customer.update({
            where: { id: data.id },
            data: {
              name: data.name,
              email: data.email,
              phone: data.phone,
            },
          });
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error updating customer:', error);
          channel.nack(msg, false, true);
        }
      }
    });
    channel.consume('customer-delete-queue', async (msg) => {
      if (msg) {
        const { id } = JSON.parse(msg.content.toString());
    
        try {
          // Check if the customer exists before deleting
          const customer = await prisma.customer.findUnique({
            where: { id },
          });
    
          if (!customer) {
            console.log(`Customer with id ${id} does not exist. Acknowledging message.`);
            channel.ack(msg); // Acknowledge message even if the customer does not exist
            return; // Exit early if customer does not exist
          }
    
          // Proceed with deletion if customer exists
          await prisma.customer.delete({
            where: { id },
          });
    
          console.log(`Customer with id ${id} deleted successfully.`);
          channel.ack(msg); // Acknowledge the message after successful deletion
    
        } catch (error) {
          console.error('Error deleting customer:', error);
    
          // Handle specific Prisma error codes
          if ((error as any).code === 'P2025') {
            console.log(`Customer with id ${id} not found. Skipping deletion.`);
            channel.ack(msg); // Acknowledge the message even if the customer is not found
          } else {
            // Nack message to requeue it for retry
            channel.nack(msg, false, true); 
          }
        }
      }
    });

    channel.consume('order-update-queue', async (msg) => {
      if (msg) {
        const { key, data } = JSON.parse(msg.content.toString());
        try {
          await prisma.$transaction(async (tx) => {
            const oldOrder = await tx.order.findUnique({
              where: { id: data.id },
            });

            const updatedOrder = await tx.order.update({
              where: { id: data.id },
              data: {
                amount: data.amount,
                status: data.status,
              },
            });

            // Update customer's total spending if order status changed to COMPLETED
            if (oldOrder?.status !== 'COMPLETED' && updatedOrder.status === 'COMPLETED') {
              await tx.customer.update({
                where: { id: updatedOrder.customerId },
                data: {
                  totalSpending: {
                    increment: updatedOrder.amount,
                  },
                  lastOrderDate: updatedOrder.createdAt,
                },
              });
            }
          });
          await redis.del(key);
          channel.ack(msg);
        } catch (error) {
          console.error('Error updating order:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    channel.consume('order-delete-queue', async (msg) => {
      if (msg) {
        const { id } = JSON.parse(msg.content.toString());
        try {
          await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
              where: { id },
            });

            if (order?.status === 'COMPLETED') {
              await tx.customer.update({
                where: { id: order.customerId },
                data: {
                  totalSpending: {
                    decrement: order.amount,
                  },
                },
              });
            }

            await tx.order.delete({
              where: { id },
            });
          });
          channel.ack(msg);
        } catch (error) {
          console.error('Error deleting order:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    // Metrics consumers
    channel.consume('customer-metrics-queue', async (msg) => {
      if (msg) {
        try {
          const metrics = await prisma.$transaction(async (tx) => {
            const totalCustomers = await tx.customer.count();
            const customersWithOrders = await tx.customer.count({
              where: {
                orders: {
                  some: {}
                }
              }
            });
            const totalSpending = await tx.customer.aggregate({
              _sum: {
                totalSpending: true
              }
            });
            const avgSpending = await tx.customer.aggregate({
              _avg: {
                totalSpending: true
              }
            });
            
            return {
              totalCustomers,
              customersWithOrders,
              totalSpending: totalSpending._sum.totalSpending || 0,
              averageSpending: avgSpending._avg.totalSpending || 0,
              calculatedAt: new Date()
            };
          });

          await redis.setex('customer:metrics', 3600, JSON.stringify(metrics));
          channel.ack(msg);
        } catch (error) {
          console.error('Error calculating customer metrics:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    channel.consume('order-metrics-queue', async (msg) => {
      if (msg) {
        try {
          const metrics = await prisma.$transaction(async (tx) => {
            const totalOrders = await tx.order.count();
            const completedOrders = await tx.order.count({
              where: {
                status: 'COMPLETED'
              }
            });
            const totalRevenue = await tx.order.aggregate({
              where: {
                status: 'COMPLETED'
              },
              _sum: {
                amount: true
              }
            });
            const avgOrderValue = await tx.order.aggregate({
              where: {
                status: 'COMPLETED'
              },
              _avg: {
                amount: true
              }
            });
            const ordersByStatus = await tx.order.groupBy({
              by: ['status'],
              _count: true
            });
            
            return {
              totalOrders,
              completedOrders,
              totalRevenue: totalRevenue._sum.amount || 0,
              averageOrderValue: avgOrderValue._avg.amount || 0,
              ordersByStatus: ordersByStatus.reduce((acc, curr) => ({
                ...acc,
                [curr.status]: curr._count
              }), {}),
              calculatedAt: new Date()
            };
          });

          await redis.setex('order:metrics', 3600, JSON.stringify(metrics));
          channel.ack(msg);
        } catch (error) {
          console.error('Error calculating order metrics:', error);
          channel.nack(msg, false, true);
        }
      }
    });
  }
}