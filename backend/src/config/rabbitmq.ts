import amqp, { Connection, Channel } from 'amqplib';

class RabbitMQConfig {
  private static connection: Connection;
  private static channel: Channel;

  public static async getConnection(): Promise<Connection> {
    if (!this.connection) {
      const url = `amqp://${process.env.RABBITMQ_DEFAULT_USER || 'user'}:${process.env.RABBITMQ_DEFAULT_PASS || 'password'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`;
      this.connection = await amqp.connect(url);
    }
    return this.connection;
  }

  public static async getChannel(): Promise<Channel> {
    if (!this.channel) {
      const connection = await this.getConnection();
      this.channel = await connection.createChannel();

      // Define all exchanges first
      const exchanges = [
        { name: 'data-ingestion', type: 'direct' },
        { name: 'campaign-exchange', type: 'direct' },
        { name: 'message-exchange', type: 'direct' },
        { name: 'metrics-exchange', type: 'direct' }  // New exchange for metrics
      ];

      // Assert all exchanges
      for (const exchange of exchanges) {
        await this.channel.assertExchange(exchange.name, exchange.type, { durable: true });
      }

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

      // Assert all queues and bind them to their exchanges
      for (const queue of queues) {
        await this.channel.assertQueue(queue.name, { durable: true });
        if (queue.exchange && queue.routingKey) {
          await this.channel.bindQueue(queue.name, queue.exchange, queue.routingKey);
        }
      }
    }
    return this.channel;
  }
}

export default RabbitMQConfig;