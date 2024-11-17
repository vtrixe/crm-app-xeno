import amqp, { Connection, Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class RabbitMQConfig {
  private static connection: Connection;
  private static channel: Channel;

  public static async getConnection(): Promise<Connection> {
    if (!this.connection) {
      const url = `amqps://${process.env.RABBITMQ_DEFAULT_USER}:${process.env.RABBITMQ_DEFAULT_PASS}@${process.env.RABBITMQ_HOST}/${process.env.RABBITMQ_VHOST}`;
      this.connection = await amqp.connect(url);
    }
    return this.connection;
  }

  public static async getChannel(): Promise<Channel> {
    if (!this.channel) {
      const connection = await this.getConnection();
      this.channel = await connection.createChannel();

      // Declare all exchanges first
      const exchanges = [
        { name: 'data-ingestion', type: 'direct' },
        { name: 'campaign-exchange', type: 'direct' },
        { name: 'message-exchange', type: 'direct' },
        { name: 'metrics-exchange', type: 'direct' },  // New exchange for metrics
      ];

      // Assert all exchanges
      for (const exchange of exchanges) {
        try {
          await this.channel.assertExchange(exchange.name, exchange.type, { durable: true });
          console.log(`Exchange declared: ${exchange.name}`);
        } catch (error) {
          console.error(`Error declaring exchange ${exchange.name}:`, error);
        }
      }

      // Declare and bind all queues to their respective exchanges
      const queues = [
        { name: 'customer-queue', exchange: 'data-ingestion', routingKey: 'customer' },
        { name: 'order-queue', exchange: 'data-ingestion', routingKey: 'order' },
        { name: 'customer-update-queue', exchange: 'data-ingestion', routingKey: 'customer.update' },
        { name: 'customer-delete-queue', exchange: 'data-ingestion', routingKey: 'customer.delete' },
        { name: 'order-update-queue', exchange: 'data-ingestion', routingKey: 'order.update' },
        { name: 'order-delete-queue', exchange: 'data-ingestion', routingKey: 'order.delete' },
        { name: 'campaign-creation-queue', exchange: 'campaign-exchange', routingKey: 'campaign.create' },
        { name: 'campaign-stats-queue', exchange: 'campaign-exchange', routingKey: 'campaign.stats' },
        { name: 'message-queue', exchange: 'message-exchange', routingKey: 'message.send' },
        { name: 'customer-metrics-queue', exchange: 'metrics-exchange', routingKey: 'customer.metrics' },
        { name: 'order-metrics-queue', exchange: 'metrics-exchange', routingKey: 'order.metrics' }
      ];

      // Assert and declare queues
      for (const queue of queues) {
        try {
          // Explicitly declare the queue
          const declaredQueue = await this.channel.assertQueue(queue.name, { durable: true });
          console.log(`Queue declared: ${queue.name}`);

          // Bind the queue to the exchange with routing key
          if (queue.exchange && queue.routingKey) {
            await this.channel.bindQueue(queue.name, queue.exchange, queue.routingKey);
            console.log(`Queue ${queue.name} bound to exchange ${queue.exchange} with routing key ${queue.routingKey}`);
          }
        } catch (error) {
          console.error(`Error declaring or binding queue ${queue.name}:`, error);
        }
      }
    }
    return this.channel;
  }
}

export default RabbitMQConfig;
