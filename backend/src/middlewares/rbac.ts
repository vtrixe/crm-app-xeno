
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authorize = (requiredRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.id },
        include: { Role: true },
      });

      const roleNames = userRoles.map((ur) => ur.Role.roleName);

      if (!requiredRoles.some((role) => roleNames.includes(role))) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export default authorize;