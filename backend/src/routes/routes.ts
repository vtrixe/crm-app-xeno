
import express from 'express';
import passport from 'passport';
import dataIngestionRoutes from './dataIngestionRoutes';

const router = express.Router();


router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));


router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard'); 
  }
);


router.get('/dashboard', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      success: true,
      message: 'You have successfully logged in!',
      user: {
        id: req.user.id,
        googleId: req.user.googleId,
        email: req.user.email,
        name: req.user.name,
      },
    });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});


router.use('/api/data-ingestion', dataIngestionRoutes);

export default router;
