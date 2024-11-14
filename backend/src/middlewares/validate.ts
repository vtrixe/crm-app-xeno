
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

const orderSchema = z.object({
  customerId: z.number().positive(),
  amount: z.number().positive(),
  status: z.string().min(1)
});

export const validateCustomer = (req: Request, res: Response, next: NextFunction): void => {
  try {
    customerSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: (error as any).errors });
  }
};

export const validateOrder = (req: Request, res: Response, next: NextFunction): void => {
  try {
    orderSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: (error as any).errors });
  }
};