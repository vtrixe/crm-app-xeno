
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