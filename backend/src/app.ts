import express from 'express';
import dotenv from 'dotenv';
import DatabaseConfig from './config/database';
import RedisConfig from './config/redis';
import RabbitMQConfig from './config/rabbitmq';

dotenv.config();

class App {
  public app: express.Application;
  private port: number = parseInt(process.env.PORT || '3000', 10);

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeDatabase();
    this.initializeRedis();
    this.initializeRabbitMQ();
    this.startServer();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
  }

  private async initializeDatabase() {
    try {
      const pool = DatabaseConfig;
      await pool.getConnection(); 
      console.log('MySQL Database connected successfully');
    } catch (error) {
      console.error('Error connecting to MySQL:', error);
    }
  }

  private async initializeRedis() {
    try {
      await RedisConfig.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  private async initializeRabbitMQ() {
    try {
      await RabbitMQConfig.getConnection();
      console.log('RabbitMQ connected successfully');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  private startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

new App();
