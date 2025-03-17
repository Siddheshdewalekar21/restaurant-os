import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a test table
    const newTable = await prisma.table.create({
      data: {
        tableNumber: 1,
        capacity: 4,
        branchId: 'branch-main-01',
        status: 'AVAILABLE',
        shape: 'CIRCLE',
        width: 100,
        height: 100,
        positionX: 0,
        positionY: 0,
      }
    });
    
    console.log('Test table created successfully:', newTable);
  } catch (error) {
    console.error('Error creating test table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 