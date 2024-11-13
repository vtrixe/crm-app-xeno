import { createClient } from 'redis';

class RedisConfig {
  private static client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  });

  public static async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    return this.client;
  }
}

export default RedisConfig;
