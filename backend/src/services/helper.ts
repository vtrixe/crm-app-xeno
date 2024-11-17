import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total customers count
    const totalCustomers = await prisma.customer.count();

    // Get total orders count
    const totalOrders = await prisma.order.count();

    // Get active campaigns count
    const activeCampaigns = await prisma.campaign.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // Get customer segments count
    const customerSegments = await prisma.audienceSegment.count();

    // Get user info (assuming req.user.id exists from auth middleware)
    const user = await prisma.user.findUnique({
      where: {
        id: req.user?.id
      },
      include: {
        roles: {
          include: {
            Role: true
          }
        }
      }
    });

    res.json({
      stats: {
        totalCustomers,
        totalOrders,
        activeCampaigns,
        customerSegments
      },
      user: {
        name: user?.name,
        email: user?.email,
        roles: user?.roles.map(role => role.Role.roleName)
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};