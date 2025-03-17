import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all branches
    const branches = await prisma.branch.findMany();
    
    console.log('All branches:');
    branches.forEach(branch => {
      console.log(`ID: ${branch.id}, Name: ${branch.name}`);
    });
    
    // Check if branch-main-01 exists
    const mainBranch = await prisma.branch.findUnique({
      where: { id: 'branch-main-01' }
    });
    
    if (mainBranch) {
      console.log('\nMain branch found:', mainBranch);
    } else {
      console.log('\nMain branch not found. Creating it...');
      
      // Create main branch if it doesn't exist
      const newMainBranch = await prisma.branch.create({
        data: {
          id: 'branch-main-01',
          name: 'Main Branch',
          address: '123 Restaurant Street, Foodville',
          phoneNumber: '+1234567890',
          email: 'main@restaurant.com',
        }
      });
      
      console.log('Created main branch:', newMainBranch);
    }
  } catch (error) {
    console.error('Error checking branches:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 