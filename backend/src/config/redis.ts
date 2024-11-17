import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisConfig {
  private static client: Redis;

  private static createNewClient(): Redis {
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: {}, 
    });
  }

  public static async connect(): Promise<Redis> {
    if (!this.client) {
      this.client = this.createNewClient();
    }
    try {
      await this.client.ping();
      console.log('Connected to Redis successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
    return this.client;
  }

  public static getClient(): Redis {
    if (!this.client) {
      this.client = this.createNewClient();
    }
    return this.client;
  }
}

export default RedisConfig;
