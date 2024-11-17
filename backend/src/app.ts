
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import DatabaseConfig from './config/database';
import RedisConfig from './config/redis';
import RabbitMQConfig from './config/rabbitmq';
import passport from './config/googleOauth';
import routes from './routes/routes';
import DataConsumer from './consumers/data-ingestion';
import cors from 'cors';

dotenv.config();

class App {
  public app: express.Application;
  private port: number = parseInt(process.env.PORT || '5000', 10);

  constructor() {
    this.app = express();
    this.initialize();
  }

  private async initialize() {
    try {
      await this.initializeMiddleware();
      await this.initializeConnections();
      await this.initializeConsumers();
      this.initializeRoutes();
      this.startServer();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware() {
    this.app.set('trust proxy', 1); 
    this.app.use(cors({
      origin: 'https://crm-app-xeno.vercel.app', // Specify your frontend domain
      credentials: true,
    }));
    this.app.use(express.json());
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: true, // Set to true for HTTPS
          httpOnly: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          domain: '.onrender.com', // Match your backend domain
        },
      })
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
}


  private async initializeConnections() {
    try {
      const prismaClient = DatabaseConfig.getPrismaClient();
      await prismaClient.$connect();
      console.log('Prisma connected to MySQL Database successfully');

      await RedisConfig.connect();
      console.log('Redis connected successfully');

      await RabbitMQConfig.getConnection();
      console.log('RabbitMQ connected successfully');
    } catch (error) {
      console.error('Connection initialization failed:', error);
      throw error;
    }
  }

  private async initializeConsumers() {
    try {
      await DataConsumer.initialize();
      console.log('Data consumers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize consumers:', error);
      throw error;
    }
  }

  private initializeRoutes() {
    this.app.use('/', routes);

  }

  private startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const app = new App();
export default app;