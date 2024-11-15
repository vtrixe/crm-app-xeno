import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Channel } from 'amqplib';
import { z } from 'zod';
import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';

export const filterSchema = z.object({
  field: z.enum(['totalSpending', 'visits', 'lastVisited']),
  operator: z.enum(['>', '<', '>=', '<=', '=']),
  value: z.number().optional(),
  dateValue: z.date().optional()
});

export const segmentSchema = z.object({
  name: z.string(),
  filters: z.array(filterSchema)
});

export class AudienceSegmentationService {
  constructor(
    private prisma: PrismaClient,
    private redis: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
    private channel: Channel
  ) {}

  async createSegment(data: z.infer<typeof segmentSchema>, userId: number) {
    const segment = await this.prisma.audienceSegment.create({
      data: {
        name: data.name,
        createdBy: userId,
        updatedBy: userId,
        filters: {
          createMany: {
            data: data.filters
          }
        }
      },
      include: { filters: true }
    });

    await this.channel.publish(
      'audience-segmentation',
      'calculate-size',
      Buffer.from(JSON.stringify({ segmentId: segment.id }))
    );

    return segment;
  }

  async updateSegment(id: number, data: z.infer<typeof segmentSchema>, userId: number) {
    await this.prisma.segmentFilter.deleteMany({
      where: { segmentId: id }
    });

    const segment = await this.prisma.audienceSegment.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: userId,
        filters: {
          createMany: {
            data: data.filters
          }
        }
      },
      include: { filters: true }
    });

    await this.channel.publish(
      'audience-segmentation',
      'calculate-size',
      Buffer.from(JSON.stringify({ segmentId: segment.id }))
    );

    await this.redis.del(`segment:${id}`);
    await this.redis.del('all-segments');

    return segment;
  }

  async deleteSegment(id: number) {
    await this.prisma.segmentFilter.deleteMany({
      where: { segmentId: id }
    });

    await this.prisma.audienceSegment.delete({
      where: { id }
    });

    await this.redis.del(`segment:${id}`);
    await this.redis.del('all-segments');
  }

  async getSegments() {
    const cached = await this.redis.get('all-segments');
    if (cached) return JSON.parse(cached);

    const segments = await this.prisma.audienceSegment.findMany({
      include: { filters: true }
    });

    await this.redis.setEx('all-segments', 300, JSON.stringify(segments));
    return segments;
  }

  async getSegmentById(id: number) {
    const cached = await this.redis.get(`segment:${id}`);
    if (cached) return JSON.parse(cached);

    const segment = await this.prisma.audienceSegment.findUnique({
      where: { id },
      include: { filters: true }
    });

    if (segment) {
      await this.redis.setEx(`segment:${id}`, 300, JSON.stringify(segment));
    }

    return segment;
  }

  async calculateSegmentSize(segmentId: number) {
    const segment = await this.prisma.audienceSegment.findUnique({
      where: { id: segmentId },
      include: { filters: true }
    });

    if (!segment) return;

    let whereConditions: { [key: string]: any } = {};
    segment.filters.forEach(filter => {
      whereConditions[filter.field] = {
        [filter.operator]: filter.value || filter.dateValue
      };
    });

    const count = await this.prisma.customer.count({
      where: whereConditions
    });

    await this.prisma.audienceSegment.update({
      where: { id: segmentId },
      data: { audienceSize: count }
    });


await this.redis.del(`segment:${segmentId}`);
    await this.redis.del('all-segments');
  }
}