import { z } from 'zod';

export const CreateOrderDto = z.object({
    customerId: z.number().int().positive(),
    amount: z.number().positive(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
  });
  
  export type CreateOrderDtoType = z.infer<typeof CreateOrderDto>;