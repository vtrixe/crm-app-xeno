import { Request, Response } from 'express';
import { AudienceSegmentationService } from '@/services/audience-segmentation';
import { segmentSchema } from '@/services/audience-segmentation';

interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: Date;
    googleId: string;
  }
}

export class AudienceSegmentController {
  constructor(private segmentService: AudienceSegmentationService) {}

  async createSegment(req: AuthRequest, res: Response) {
    try {
      const validatedData = segmentSchema.parse(req.body);
      const segment = await this.segmentService.createSegment(validatedData, req.user.id);
      res.status(201).json(segment);
    } catch (error) {
      res.status(400).json({ error: 'Invalid segment data' });
    }
  }

  async updateSegment(req: AuthRequest, res: Response) {
    try {
      const validatedData = segmentSchema.parse(req.body);
      const segment = await this.segmentService.updateSegment(
        Number(req.params.id),
        validatedData,
        req.user.id
      );
      res.json(segment);
    } catch (error) {
      res.status(400).json({ error: 'Invalid segment data' });
    }
  }

  async deleteSegment(req: Request, res: Response) {
    try {
      await this.segmentService.deleteSegment(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: 'Segment not found' });
    }
  }

  async getSegments(req: Request, res: Response) {
    const segments = await this.segmentService.getSegments();
    res.json(segments);
  }

  async getSegmentById(req: Request, res: Response) {
    const segment = await this.segmentService.getSegmentById(Number(req.params.id));
    if (!segment) {
      res.status(404).json({ error: 'Segment not found' });
      return;
    }
    res.json(segment);
  }

  async validateSegmentSize(req: AuthRequest, res: Response) {
    try {
      const segmentId = Number(req.params.id);
      await this.segmentService.calculateSegmentSize(segmentId);
      res.status(200).json({ message: `Audience size for segment ${segmentId} validated.` });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
  
}