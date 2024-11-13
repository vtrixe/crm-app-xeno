import { createPool, Pool } from 'mysql2/promise';

class DatabaseConfig {
  private static pool: Pool;

  public static getPool(): Pool {
    if (!this.pool) {
      this.pool = createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'crm_user',
        password: process.env.MYSQL_PASSWORD || 'crm_password',
        database: process.env.MYSQL_DATABASE || 'crm_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    return this.pool;
  }
}

export default DatabaseConfig.getPool();
