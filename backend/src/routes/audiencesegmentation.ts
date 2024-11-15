import express, { Request, Response, NextFunction } from 'express';
import { AudienceSegmentationService } from '@/services/audience-segmentation';
import authorize from '@/middlewares/rbac';
import { PrismaClient } from '@prisma/client';
import RedisConfig from '../config/redis';
import AudienceSegmentationQueue from '@/workers/audience-segment';
import { AuthRequest } from '@/types/segment';
import { AudienceSegmentController } from '@/controllers/audience-segmentation';

const router = express.Router();
const prisma = new PrismaClient();

async function initializeController() {
  const channel = await AudienceSegmentationQueue.setupQueues();
  const redis = await RedisConfig.connect();
  const controller = new AudienceSegmentController(
    new AudienceSegmentationService(prisma, redis, channel)
  );

  const handleRequest = (fn: (req: AuthRequest, res: Response) => Promise<void>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req as AuthRequest, res);
      } catch (error) {
        next(error);
      }
    };
  };

  router.post(
    '/segments',
    authorize(['admin', 'manager']),
    handleRequest(controller.createSegment.bind(controller))
  );

  router.put(
    '/segments/:id',
    authorize(['admin', 'manager']),
    handleRequest(controller.updateSegment.bind(controller))
  );

  router.delete(
    '/segments/:id',
    authorize(['admin', 'manager']),
    controller.deleteSegment.bind(controller)
  );

  router.get(
    '/segments',
    authorize(['admin', 'manager', 'analyst', 'viewer']),
    controller.getSegments.bind(controller)
  );

  router.get(
    '/segments/:id',
    authorize(['admin', 'manager', 'analyst', 'viewer']),
    controller.getSegmentById.bind(controller)
  );

  return router;
}

export default initializeController();