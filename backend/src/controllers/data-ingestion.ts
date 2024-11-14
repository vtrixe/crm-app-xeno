import { Request, Response } from 'express';
import DataIngestionService from '../services/data-ingestion';

export default class DataIngestionController {
  static async ingestCustomer(req: Request, res: Response) {
    try {
      await DataIngestionService.publishCustomer(req.body);
      res.status(202).json({ message: 'Customer data accepted for processing' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async ingestOrder(req: Request, res: Response) {
    try {
      await DataIngestionService.publishOrder(req.body);
      res.status(202).json({ message: 'Order data accepted for processing' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}
