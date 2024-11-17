import { Request, RequestHandler, Response } from 'express';
import MetricsService from '@/services/metrics';
import { CustomerService } from '@/services/customer';
import { OrderService } from '@/services/order';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export default class MetricsController {
  static async getCustomerMetrics(req: Request, res: Response) : Promise<any> {
    try {
      const metrics = await MetricsService.getCustomerMetrics();
      
      if (!metrics) {
        // If no metrics exist, calculate them
        const newMetrics = await MetricsService.calculateAndGetMetrics('customer');
        return res.json(newMetrics);
      }

      // Check if metrics are stale (older than 1 hour)
      const calculatedAt = new Date(metrics.calculatedAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (calculatedAt < oneHourAgo) {
        // Trigger new calculation and return existing metrics
        CustomerService.publishMetricsCalculation('customer');
      }
      
      return res.json(metrics);
    } catch (error) {
      console.error('Error fetching customer metrics:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch customer metrics',
        message: (error instanceof Error) ? error.message : 'Unknown error'
      });
    }
  }

  static async getOrderMetrics(req: Request, res: Response) : Promise<any> {
    try {
      const metrics = await MetricsService.getOrderMetrics();
      
      if (!metrics) {
        // If no metrics exist, calculate them
        const newMetrics = await MetricsService.calculateAndGetMetrics('order');
        return res.json(newMetrics);
      }

      // Check if metrics are stale (older than 1 hour)
      const calculatedAt = new Date(metrics.calculatedAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (calculatedAt < oneHourAgo) {
        // Trigger new calculation and return existing metrics
        OrderService.publishMetricsCalculation('order');
      }
      
      return res.json(metrics);
    } catch (error) {
      console.error('Error fetching order metrics:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch order metrics',
        message: (error instanceof Error) ? error.message : 'Unknown error'
      });
    }
  }

  static async calculateMetrics(req: Request, res: Response) : Promise<any> {
    try {
      const { type } = req.params;
      
      if (type !== 'customer' && type !== 'order') {
        return res.status(400).json({ error: 'Invalid metrics type' });
      }

      // Trigger calculation
      await OrderService.publishMetricsCalculation(type);
      
      // Wait for and return new metrics
      const metrics = await MetricsService.calculateAndGetMetrics(type);
      return res.json(metrics);
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return res.status(500).json({ 
        error: 'Failed to calculate metrics',
        message: (error instanceof Error) ? error.message : 'Unknown error'
      });
    }
  }





}
