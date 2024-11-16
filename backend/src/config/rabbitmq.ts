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
      
 
      await this.channel.assertExchange('data-ingestion', 'direct', { durable: true });
      await this.channel.assertQueue('customer-queue', { durable: true });
      await this.channel.assertQueue('order-queue', { durable: true });
      
      await this.channel.bindQueue('customer-queue', 'data-ingestion', 'customer');
      await this.channel.bindQueue('order-queue', 'data-ingestion', 'order');

      await this.channel.assertExchange('campaign-exchange', 'direct', { durable: true });
      await this.channel.assertQueue('campaign-creation-queue', { durable: true });
      await this.channel.assertQueue('campaign-stats-queue', { durable: true });
      
      await this.channel.bindQueue('campaign-creation-queue', 'campaign-exchange', 'campaign.create');
      await this.channel.bindQueue('campaign-stats-queue', 'campaign-exchange', 'campaign.stats');

      await this.channel.assertExchange('message-exchange', 'direct', { durable: true });
      await this.channel.assertQueue('message-queue', { durable: true });
      await this.channel.bindQueue('message-queue', 'message-exchange', 'message.send');

    }
    return this.channel;
  }
}

export default RabbitMQConfig;