import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const FRONTEND_URL = 'https://crm-app-xeno.vercel.app';
const BACKEND_URL = 'https://crm-app-xeno-1.onrender.com';

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
      callbackURL: `${BACKEND_URL}/auth/google/callback`,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found'));
        }

        let user = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: {
            UserRole: {
              include: {
                Role: true
              }
            }
          }
        });

        if (!user) {
          const whitelisted = await prisma.whitelistedEmail.findUnique({
            where: { email },
          });
          const roleId = whitelisted ? whitelisted.roleId : 1;

          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              createdAt: new Date(),
              UserRole: {
                create: {
                  roleId: roleId
                }
              }
            },
            include: {
              UserRole: {
                include: {
                  Role: true
                }
              }
            }
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        UserRole: {
          include: {
            Role: true
          }
        }
      }
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
