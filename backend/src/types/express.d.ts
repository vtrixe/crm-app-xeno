// src/types/express.d.ts
import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: PrismaUser; // Add the user property with the type User
    }
  }
}
