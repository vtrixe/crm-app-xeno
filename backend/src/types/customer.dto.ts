import { z } from 'zod';

export const CreateCustomerDto = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type CreateCustomerDtoType = z.infer<typeof CreateCustomerDto>;