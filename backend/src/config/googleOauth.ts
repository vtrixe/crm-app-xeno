import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface User {
      id: number;
      googleId: string;
      email: string;
      name: string;
      createdAt: Date;
    }
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:5000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found'));
        }

        
        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
     
          const whitelisted = await prisma.whitelistedEmail.findUnique({
            where: { email },
          });
          const roleId = whitelisted ? whitelisted.roleId : 1; // Default role (ensure this role exists in DB)

         
          const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
          if (!roleExists) {
            throw new Error(`Role with ID ${roleId} does not exist.`);
          }


          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              createdAt: new Date(),
            },
          });

 
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: roleId,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return done(new Error('User not found'));
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

export default passport;
