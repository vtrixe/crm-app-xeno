import { Request, Response } from 'express';
import { CustomerService } from '@/services/customer';

export default class CustomerController {
  static async getAllCustomers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customers = await CustomerService.getAllCustomers(page, limit);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getCustomerMetrics(req: Request, res: Response) {
    try {
      await CustomerService.publishMetricsCalculation('customer');
      res.status(202).json({ message: 'Customer metrics calculation initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getCustomer(req: Request, res: Response) : Promise<any> {
    try {
      const customer = await CustomerService.getCustomer(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      await CustomerService.publishCustomerUpdate({
        id: parseInt(req.params.id),
        ...req.body
      });
      res.status(202).json({ message: 'Customer update initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      await CustomerService.publishCustomerDeletion(parseInt(req.params.id));
      res.status(202).json({ message: 'Customer deletion initiated' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}