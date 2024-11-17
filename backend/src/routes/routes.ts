import express from 'express';
import passport from 'passport';
import dataIngestionRoutes from './dataIngestionRoutes';
import initializeAudienceSegmentation from './audiencesegmentation';
import { AudienceSegmentationService } from '@/services/audience-segmentation';
import campaign from './campaign';
import message from './message';
import { PrismaClient } from '@prisma/client';
import metrics from './metrics';
import { getDashboardStats } from '@/services/helper';
import { isAuthenticated } from '@/middlewares/auth';

const router = express.Router();

const prisma = new PrismaClient();

// Auth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('https://crm-app-xeno.vercel.app/dashboard'); 
  }
);

router.get('/dashboard', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    prisma.userRole.findMany({
      where: { 
        userId: req.user.id 
      },
      include: {
        Role: true
      }
    }).then(userRoles => {
      res.json({
        success: true,
        message: 'You have successfully logged in!',
        user: {
          id: req.user.id,
          googleId: req.user.googleId,
          email: req.user.email,
          name: req.user.name,
          roles: userRoles.map(ur => ({
            id: ur.roleId,
            name: ur.Role.roleName
          }))
        },
      });
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: 'Unauthorized' 
    });
  }
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to logout',
      });
    }
    res.clearCookie("connect.sid"); // Clear the session cookie if using session-based auth
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});


router.get('/api/dashboard/stats',isAuthenticated , getDashboardStats);

// API routes
router.use('/api/data-ingestion', dataIngestionRoutes);

router.use('/api/campaign', campaign);

router.use('/api/message' , message);

router.use('/api/metrics', metrics);


(async () => {
  const audienceSegmentationRouter = await initializeAudienceSegmentation;
  router.use('/api/audience-segmentation', audienceSegmentationRouter);
})();

export default router;