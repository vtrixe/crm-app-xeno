process.env.SESSION_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.PORT = '5000';


jest.mock('ioredis', () => {
  const mRedis = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null)
  };
  return jest.fn(() => mRedis);
});

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn().mockResolvedValue({}),
      consume: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn().mockResolvedValue(true),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));


jest.mock('@prisma/client', () => {
  const { PrismaClient } = jest.requireActual('@prisma/client');
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        findMany: jest.fn().mockResolvedValue([
          { Role: { id: 1, roleName: 'Admin' } }
        ]),
        create: jest.fn(),
      },
    })),
  };
});


jest.mock('passport', () => ({
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn(() => (req, res, next) => next()),
}));