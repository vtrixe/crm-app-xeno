import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';

class RedisConfig {
  private static client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

  private static createNewClient(): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
    return createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    });
  }

  public static async connect() {
    if (!this.client) {
      this.client = this.createNewClient();
    }
    
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    return this.client;
  }

  public static getClient(): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
    if (!this.client) {
      this.client = this.createNewClient();
    }
    return this.client;
  }
}

export default RedisConfig;