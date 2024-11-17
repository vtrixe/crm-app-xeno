import { Request, Response } from 'express';
import { OrderService } from '@/services/order';
export default class OrderController {
  static async getAllOrders(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const orders = await OrderService.getAllOrders(page, limit);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getOrderMetrics(req: Request, res: Response) {
    try {
      await OrderService.publishMetricsCalculation('order');
      res.status(202).json({ message: 'Order metrics calculation initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getOrder(req: Request, res: Response): Promise<any> {
    try {
      const order = await OrderService.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async updateOrder(req: Request, res: Response) {
    try {
      await OrderService.publishOrderUpdate({
        id: parseInt(req.params.id),
        ...req.body
      });
      res.status(202).json({ message: 'Order update initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async deleteOrder(req: Request, res: Response) {
    try {
      await OrderService.publishOrderDeletion(parseInt(req.params.id));
      res.status(202).json({ message: 'Order deletion initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}