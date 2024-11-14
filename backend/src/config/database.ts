import { PrismaClient } from '@prisma/client';

class DatabaseConfig {
  private static prisma: PrismaClient | null = null;


  public static getPrismaClient(): PrismaClient {
    if (!DatabaseConfig.prisma) {
      DatabaseConfig.prisma = new PrismaClient();
      DatabaseConfig.connect();
    }
    return DatabaseConfig.prisma;
  }


  private static async connect() {
    try {
      await DatabaseConfig.prisma?.$connect();
      console.log('Connected to the MySQL database successfully');
    } catch (error) {
      console.error('Error connecting to MySQL database:', error);
      throw error;
    }
  }

  
  public static async disconnect() {
    try {
      await DatabaseConfig.prisma?.$disconnect();
      console.log('Disconnected from the MySQL database');
    } catch (error) {
      console.error('Error disconnecting from MySQL database:', error);
    }
  }
}

export default DatabaseConfig;
