import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create branch
  const mainBranch = await prisma.branch.upsert({
    where: { id: 'branch-main-01' },
    update: {},
    create: {
      id: 'branch-main-01',
      name: 'Main Branch',
      address: '123 Restaurant Street, Foodville',
      phoneNumber: '+1234567890',
      email: 'main@restaurant.com',
    },
  });
  console.log('Created branch:', mainBranch.name);

  // Create staff user for the branch
  const staffPassword = await hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@restaurant.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@restaurant.com',
      password: staffPassword,
      role: 'STAFF',
      branchId: mainBranch.id,
    },
  });
  console.log('Created staff user:', staff.email);

  // Create manager user for the branch
  const managerPassword = await hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@restaurant.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@restaurant.com',
      password: managerPassword,
      role: 'MANAGER',
      branchId: mainBranch.id,
    },
  });
  console.log('Created manager user:', manager.email);

  // Create food categories
  const categories = [
    { id: 'cat-appetizers', name: 'Appetizers', image: '/images/categories/appetizers.jpg' },
    { id: 'cat-main-course', name: 'Main Course', image: '/images/categories/main-course.jpg' },
    { id: 'cat-desserts', name: 'Desserts', image: '/images/categories/desserts.jpg' },
    { id: 'cat-beverages', name: 'Beverages', image: '/images/categories/beverages.jpg' },
  ];

  for (const category of categories) {
    const createdCategory = await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    });
    console.log('Created category:', createdCategory.name);
  }

  // Create menu items
  const appetizerItems = [
    {
      id: 'item-garlic-bread',
      name: 'Garlic Bread',
      description: 'Freshly baked bread with garlic butter',
      price: 5.99,
      isAvailable: true,
      categoryId: 'cat-appetizers',
      image: '/images/menu/garlic-bread.jpg',
    },
    {
      id: 'item-mozzarella-sticks',
      name: 'Mozzarella Sticks',
      description: 'Crispy fried mozzarella sticks with marinara sauce',
      price: 7.99,
      isAvailable: true,
      categoryId: 'cat-appetizers',
      image: '/images/menu/mozzarella-sticks.jpg',
    },
  ];

  for (const item of appetizerItems) {
    const createdItem = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    console.log('Created menu item:', createdItem.name);
  }

  const mainCourseItems = [
    {
      id: 'item-margherita-pizza',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      price: 12.99,
      isAvailable: true,
      categoryId: 'cat-main-course',
      image: '/images/menu/margherita-pizza.jpg',
    },
    {
      id: 'item-spaghetti-carbonara',
      name: 'Spaghetti Carbonara',
      description: 'Spaghetti with creamy sauce, pancetta, and parmesan',
      price: 14.99,
      isAvailable: true,
      categoryId: 'cat-main-course',
      image: '/images/menu/spaghetti-carbonara.jpg',
    },
  ];

  for (const item of mainCourseItems) {
    const createdItem = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    console.log('Created menu item:', createdItem.name);
  }

  const dessertItems = [
    {
      id: 'item-tiramisu',
      name: 'Tiramisu',
      description: 'Classic Italian dessert with coffee and mascarpone',
      price: 8.99,
      isAvailable: true,
      categoryId: 'cat-desserts',
      image: '/images/menu/tiramisu.jpg',
    },
    {
      id: 'item-chocolate-brownie',
      name: 'Chocolate Brownie',
      description: 'Warm chocolate brownie with vanilla ice cream',
      price: 7.99,
      isAvailable: true,
      categoryId: 'cat-desserts',
      image: '/images/menu/chocolate-brownie.jpg',
    },
  ];

  for (const item of dessertItems) {
    const createdItem = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    console.log('Created menu item:', createdItem.name);
  }

  const beverageItems = [
    {
      id: 'item-sparkling-water',
      name: 'Sparkling Water',
      description: 'Refreshing sparkling water',
      price: 2.99,
      isAvailable: true,
      categoryId: 'cat-beverages',
      image: '/images/menu/sparkling-water.jpg',
    },
    {
      id: 'item-iced-tea',
      name: 'Iced Tea',
      description: 'Freshly brewed iced tea',
      price: 3.99,
      isAvailable: true,
      categoryId: 'cat-beverages',
      image: '/images/menu/iced-tea.jpg',
    },
  ];

  for (const item of beverageItems) {
    const createdItem = await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    console.log('Created menu item:', createdItem.name);
  }

  // Create tables
  const tables = [
    {
      id: 'table-1',
      tableNumber: 1,
      capacity: 2,
      status: 'AVAILABLE',
      branchId: mainBranch.id,
      positionX: 100,
      positionY: 100,
      shape: 'CIRCLE',
      width: 80,
      height: 80,
    },
    {
      id: 'table-2',
      tableNumber: 2,
      capacity: 4,
      status: 'AVAILABLE',
      branchId: mainBranch.id,
      positionX: 250,
      positionY: 100,
      shape: 'RECTANGLE',
      width: 120,
      height: 80,
    },
    {
      id: 'table-3',
      tableNumber: 3,
      capacity: 6,
      status: 'AVAILABLE',
      branchId: mainBranch.id,
      positionX: 100,
      positionY: 250,
      shape: 'RECTANGLE',
      width: 160,
      height: 80,
    },
    {
      id: 'table-4',
      tableNumber: 4,
      capacity: 2,
      status: 'AVAILABLE',
      branchId: mainBranch.id,
      positionX: 250,
      positionY: 250,
      shape: 'CIRCLE',
      width: 80,
      height: 80,
    },
  ];

  for (const table of tables) {
    const createdTable = await prisma.table.upsert({
      where: { id: table.id },
      update: {},
      create: table,
    });
    console.log('Created table:', createdTable.tableNumber);
  }

  // Create a customer
  const customer = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      name: 'John Doe',
      email: 'customer@example.com',
      phone: '+1987654321',
      address: '456 Customer Street, Cityville',
    },
  });
  console.log('Created customer:', customer.name);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 