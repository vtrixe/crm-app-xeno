
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(), // Ensure phone number is valid
  totalSpending: z.number().min(0, 'Total spending cannot be negative'), // Ensure total spending is non-negative
  visits: z.number().int().min(0, 'Visits cannot be negative'),
  lastVisited: z.date().optional(),
  lastOrderDate: z.date().optional(),
});

export const orderSchema = z.object({
  customerId: z.number().int().min(1, 'Customer ID is required'),
  amount: z.number().min(0, 'Amount should be a positive number'), // Ensure amount is positive
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).refine((val) => ['PENDING', 'COMPLETED', 'CANCELLED'].includes(val), {
    message: 'Invalid order status',
  }), 
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




const campaignSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: z.number().positive(),
  targetAudience: z.string().min(1),
  messageTemplate: z.string().min(1)
});

const campaignStatsSchema = z.object({
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  conversions: z.number().int().nonnegative(),
  // Add other stats fields as needed
});

export const validateCampaign = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    campaignSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid campaign data' });
  }
};

export const validateCampaignStats = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    campaignStatsSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid campaign stats data' });
  }
};