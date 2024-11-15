import { Request } from 'express';

export interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: Date;
    googleId: string;
  }
}