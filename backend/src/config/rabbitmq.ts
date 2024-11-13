import amqp, { Connection } from 'amqplib';

class RabbitMQConfig {
  private static connection: Connection;

  public static async getConnection(): Promise<Connection> {
    if (!this.connection) {
      const url = `amqp://${process.env.RABBITMQ_DEFAULT_USER || 'user'}:${process.env.RABBITMQ_DEFAULT_PASS || 'password'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`;
      this.connection = await amqp.connect(url);
    }
    return this.connection;
  }
}

export default RabbitMQConfig;
