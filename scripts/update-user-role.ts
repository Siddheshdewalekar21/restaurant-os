import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Update the staff user to have ADMIN role
    const updatedUser = await prisma.user.update({
      where: { email: 'staff@restaurant.com' },
      data: { role: 'ADMIN' },
    });
    
    console.log('User role updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 