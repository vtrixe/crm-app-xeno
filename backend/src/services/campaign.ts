import { PrismaClient, Campaign, CampaignStatus, CampaignStats, Prisma } from '@prisma/client';
import RedisConfig from '../config/redis';
import RabbitMQConfig from '../config/rabbitmq';
import { Channel } from 'amqplib';

const prisma = new PrismaClient();

// DTOs and Interfaces
interface CreateCampaignDTO {
  name: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  targetAudience: string;
  messageTemplate: string;
  audienceSegmentIds: number[];
}

interface UpdateCampaignDTO extends Partial<CreateCampaignDTO> {
  status?: CampaignStatus;
}

interface CampaignStatsDTO {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  cost?: number;
  ctr?: number;
  cpc?: number;
  cpa?: number;
  roi?: number;
}

class CampaignError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CampaignError';
  }
}

export default class CampaignService {
  private static async cacheAndPublish(channel: Channel, campaign: Campaign, action: string) {
    const redis = RedisConfig.getClient();
    const key = `campaign:${campaign.id}`;
    await redis.set(key, JSON.stringify(campaign));
    await redis.expire(key, 3600);

    await channel.publish(
      'campaign-exchange',
      `campaign.${action}`,
      Buffer.from(JSON.stringify({ key, data: campaign }))
    );
  }

  static async createCampaign(campaignData: CreateCampaignDTO, userId: number): Promise<Campaign> {
    try {
      const channel = await RabbitMQConfig.getChannel();

      // Validate dates
      if (campaignData.startDate <= new Date() || campaignData.endDate <= campaignData.startDate) {
        throw new CampaignError('Invalid campaign dates');
      }

      // Validate budget
      if (campaignData.budget <= 0) {
        throw new CampaignError('Budget must be greater than 0');
      }

      // Check if audience segments exist
      const segments = await prisma.audienceSegment.findMany({
        where: {
          id: {
            in: campaignData.audienceSegmentIds
          }
        }
      });

      if (segments.length !== campaignData.audienceSegmentIds.length) {
        throw new CampaignError('One or more audience segments not found');
      }

      const campaign = await prisma.campaign.create({
        data: {
          name: campaignData.name,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
          budget: campaignData.budget,
          targetAudience: campaignData.targetAudience,
          messageTemplate: campaignData.messageTemplate,
          status: CampaignStatus.DRAFT,
          createdBy: userId,
          updatedBy: userId,
          audienceSegments: {
            create: campaignData.audienceSegmentIds.map(audienceSegmentId => ({
              audienceSegment: {
                connect: { id: audienceSegmentId }
              }
            }))
          }
        },
        include: {
          audienceSegments: {
            include: {
              audienceSegment: true
            }
          }
        }
      });

      // Automatically create initial stats
      await prisma.campaignStats.create({
        data: {
          campaignId: campaign.id
        }
      });

      // Log history for creation
      await this.updateCampaignHistory(
        campaign.id,
        'CREATE',
        '', // No old value for creation
        JSON.stringify(campaign), // Log the new campaign details
        userId
      );

      await this.cacheAndPublish(channel, campaign, 'create');
      return campaign;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }  
  
  static async getCampaign(id: number) {
    try {
      const redis = RedisConfig.getClient();
      
  
  
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          stats: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          audienceSegments: {
            include: {
              audienceSegment: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          updater: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          messages: {
            select: {
              id: true,
              status: true,
              sentAt: true,
              deliveredAt: true
            }
          },
          history: {
            orderBy: {
              updatedAt: 'desc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
  
      if (!campaign) {
        throw new CampaignError('Campaign not found');
      }
  
      const enrichedCampaign = {
        ...campaign,
        statusDetails: {
          current: campaign.status,
          isActive: campaign.status === 'ACTIVE',
          canActivate: campaign.status === 'DRAFT' || campaign.status === 'PAUSED',
          canPause: campaign.status === 'ACTIVE',
          canComplete: ['ACTIVE', 'PAUSED'].includes(campaign.status)
        },
        historyAnalytics: {
          totalUpdates: campaign.history.length,
          lastUpdate: campaign.history[0]?.updatedAt || campaign.createdAt,
          statusChanges: campaign.history.filter(h => 
            JSON.parse(h.oldValue).status !== JSON.parse(h.newValue).status
          ).length
        }
      };
  
      await redis.set(`campaign:${id}`, JSON.stringify(enrichedCampaign));
      await redis.expire(`campaign:${id}`, 3600);
      return enrichedCampaign;
  
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  static async updateCampaign(id: number, updateData: UpdateCampaignDTO, userId: number) {
    try {
      const channel = await RabbitMQConfig.getChannel();

      // Get existing campaign
      const existingCampaign = await this.getCampaign(id);
      if (!existingCampaign) {
        throw new CampaignError('Campaign not found');
      }

      // Prepare audience segments update if provided
      let audienceSegmentsUpdate = {};
      if (updateData.audienceSegmentIds) {
        // Delete existing connections
        await prisma.campaignAudienceSegment.deleteMany({
          where: { campaignId: id }
        });

        // Create new connections
        audienceSegmentsUpdate = {
          create: updateData.audienceSegmentIds.map(audienceSegmentId => ({
            audienceSegment: {
              connect: { id: audienceSegmentId }
            }
          }))
        };
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.startDate && { startDate: updateData.startDate }),
          ...(updateData.endDate && { endDate: updateData.endDate }),
          ...(updateData.budget && { budget: updateData.budget }),
          ...(updateData.targetAudience && { targetAudience: updateData.targetAudience }),
          ...(updateData.messageTemplate && { messageTemplate: updateData.messageTemplate }),
          ...(updateData.status && { status: updateData.status }),
          updatedBy: userId,
          audienceSegments: audienceSegmentsUpdate
        },
        include: {
          audienceSegments: {
            include: {
              audienceSegment: true
            }
          },
          stats: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      await this.cacheAndPublish(channel, campaign, 'update');

      await this.updateCampaignHistory(
        id,
        'UPDATE',
        JSON.stringify(existingCampaign),
        JSON.stringify(campaign),
        userId
      );

      // Create history entry
      await this.updateCampaignHistory(
        id,
        'UPDATE',
        JSON.stringify(existingCampaign),
        JSON.stringify(campaign),
        userId
    );

      return campaign;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  static async updateCampaignStats(campaignId: number, stats: CampaignStatsDTO) {
    try {
      const redis = RedisConfig.getClient();
      const channel = await RabbitMQConfig.getChannel();

      const campaignStats = await prisma.campaignStats.create({
        data: {
          campaignId,
          ...stats
        }
      });

      const key = `campaign-stats:${campaignId}:${Date.now()}`;
      await redis.set(key, JSON.stringify(campaignStats));
      await redis.expire(key, 3600);

      await channel.publish(
        'campaign-exchange',
        'campaign.stats',
        Buffer.from(JSON.stringify({ key, campaignId, stats: campaignStats }))
      );

      return campaignStats;

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  static async updateCampaignHistory(
    campaignId: number,
    action: string,
    oldValue: string,
    newValue: string,
    updatedBy: number
  ) {
    try {
      return await prisma.campaignHistory.create({
        data: {
          campaignId,
          action,
          oldValue,
          newValue,
          updatedBy,
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  static async deleteCampaign(campaignId: number, userId: number) {
    try {
      // Get existing campaign for history
      const existingCampaign = await this.getCampaign(campaignId);
      if (!existingCampaign) {
        throw new CampaignError('Campaign not found');
      }

      // Begin transaction
      await prisma.$transaction(async (tx) => {
        // Delete campaign audience segments
        await tx.campaignAudienceSegment.deleteMany({
          where: { campaignId }
        });

        // Delete messages
        await tx.message.deleteMany({
          where: { campaignId }
        });

        // Delete history
        await tx.campaignHistory.deleteMany({
          where: { campaignId }
        });

        // Delete stats
        await tx.campaignStats.deleteMany({
          where: { campaignId }
        });

        // Delete campaign
        await tx.campaign.delete({
          where: { id: campaignId }
        });
      });

      await this.updateCampaignHistory(
        campaignId,
        'DELETE',
        JSON.stringify(existingCampaign),
        '',
        userId
    );

      // Clear cache
      const redis = RedisConfig.getClient();
      await redis.del(`campaign:${campaignId}`);

      // Publish delete event
      const channel = await RabbitMQConfig.getChannel();
      await channel.publish(
        'campaign-exchange',
        'campaign.delete',
        Buffer.from(JSON.stringify({ 
          campaignId, 
          userId,
          previousData: existingCampaign 
        }))
      );

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  static async listCampaigns(filters: {
    status?: CampaignStatus;
    createdBy?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}, 
  pagination: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const where: Prisma.CampaignWhereInput = {
        ...(filters.status && { status: filters.status }),
        ...(filters.createdBy && { createdBy: filters.createdBy }),
        ...(filters.startDate && { startDate: { gte: filters.startDate } }),
        ...(filters.endDate && { endDate: { lte: filters.endDate } })
      };

      const [campaigns, total] = await prisma.$transaction([
        prisma.campaign.findMany({
          where,
          skip,
          take: limit,
          include: {
            audienceSegments: {
              include: {
                audienceSegment: true
              }
            },
            stats: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            updater: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            messages: {
              select: {
                id: true,
                status: true,
                sentAt: true,
                deliveredAt: true
              }
            },
            history: {
              orderBy: {
                updatedAt: 'desc'
              },
              take: 10, // Limit history to most recent 10 entries for list view
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.campaign.count({ where })
      ]);

      const enrichedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        statusDetails: {
          current: campaign.status,
          isActive: campaign.status === 'ACTIVE',
          canActivate: campaign.status === 'DRAFT' || campaign.status === 'PAUSED',
          canPause: campaign.status === 'ACTIVE',
          canComplete: ['ACTIVE', 'PAUSED'].includes(campaign.status)
        },
        historyAnalytics: {
          totalUpdates: campaign.history.length,
          lastUpdate: campaign.history[0]?.updatedAt || campaign.createdAt,
          statusChanges: campaign.history.filter(h => {
            try {
              const oldValue = JSON.parse(h.oldValue);
              const newValue = JSON.parse(h.newValue);
              return oldValue.status !== newValue.status;
            } catch {
              return false;
            }
          }).length
        }
      }));

      return {
        data: enrichedCampaigns,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CampaignError(`Database error: ${error.message}`);
      }
      throw error;
    }
  }
}