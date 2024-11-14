import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {

  const roles = [
    { roleName: 'Admin' },
    { roleName: 'Manager' },
    { roleName: 'Analyst' },
    { roleName: 'Viewer' },
  ];

  for (const role of roles) {
    
    const existingRole = await prisma.role.findUnique({
      where: { roleName: role.roleName },
    });

    if (!existingRole) {

      await prisma.role.create({
        data: {
          roleName: role.roleName,
        },
      });
      console.log(`Created role: ${role.roleName}`);
    } else {
      console.log(`Role ${role.roleName} already exists.`);
    }
  }
}

seed()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
