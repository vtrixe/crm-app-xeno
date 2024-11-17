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

const FRONTEND_URL = 'https://crm-app-xeno.vercel.app';

router.get('/auth/google', 
  passport.authenticate('google', { 
    scope: ['email', 'profile'],
    prompt: 'select_account'
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/dashboard`);
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
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
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