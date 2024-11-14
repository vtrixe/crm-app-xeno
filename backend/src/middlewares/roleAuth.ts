import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';


declare module 'express' {
  interface Request {
    user?: User;
  }
}

const prisma = new PrismaClient();

export const checkRole = (allowedRoles: number[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: { roleId: true }
      });

      const hasPermission = userRoles.some(role =>
        allowedRoles.includes(role.roleId)
      );

      if (!hasPermission) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking role' });
      return;
    }
  };
};