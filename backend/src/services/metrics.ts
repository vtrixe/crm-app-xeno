// services/MetricsService.ts
import CustomerController from '@/controllers/customer';
import RedisConfig from '../config/redis';
import { CustomerService } from './customer';


export interface CustomerMetrics {
    totalCustomers: number;
    customersWithOrders: number;
    totalSpending: number;
    averageSpending: number;
    calculatedAt: Date;
  }
  
  export interface OrderMetrics {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: {
      [key: string]: number;
    };
    calculatedAt: Date;
  }
export default class MetricsService {
  static async getCustomerMetrics(): Promise<CustomerMetrics | null> {
    const redis = RedisConfig.getClient();
    const metrics = await redis.get('customer:metrics');
    
    if (!metrics) {
      return null;
    }

    return JSON.parse(metrics);
  }

  static async getOrderMetrics(): Promise<OrderMetrics | null> {
    const redis = RedisConfig.getClient();
    const metrics = await redis.get('order:metrics');
    
    if (!metrics) {
      return null;
    }

    return JSON.parse(metrics);
  }

  static async calculateAndGetMetrics(type: 'customer' | 'order'): Promise<any> {
    const redis = RedisConfig.getClient();
    
    // Initiate calculation
    await CustomerService.publishMetricsCalculation(type);
    
    // Wait for metrics to be calculated (with timeout)
    let attempts = 0;
    const maxAttempts = 10;
    const delayMs = 500;

    while (attempts < maxAttempts) {
      const metrics = await redis.get(`${type}:metrics`);
      if (metrics) {
        return JSON.parse(metrics);
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error(`Metrics calculation timeout for ${type}`);
  }
}


