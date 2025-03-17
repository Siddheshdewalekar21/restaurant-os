# 🍽️ RestaurantOS - Restaurant Management System

RestaurantOS is a comprehensive restaurant management system designed to streamline daily operations, from order management to inventory tracking and customer engagement. Built with cutting-edge technologies, it helps restaurants operate more efficiently and deliver a seamless customer experience.

## 🚀 Features

- **Dashboard**: Real-time analytics and restaurant performance metrics
- **Order Management**: Track and manage orders in real-time
- **Menu Management**: Create and update menu items and categories
- **Table Management**: Interactive floor plan and table status tracking
- **Customer Management**: Customer database with loyalty points
- **Kitchen Display System**: Real-time order tickets for kitchen staff
- **Inventory Management**: Track stock levels and get alerts for low inventory
- **Analytics**: Detailed reports on sales, inventory, and customer behavior
- **Multi-branch Support**: Manage multiple restaurant locations
- **User Roles**: Role-based access control (Admin, Manager, Staff)
- **Real-time Updates**: Socket.io integration for live updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **State Management**: React Hooks
- **Form Handling**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 20.x or higher
- MySQL database

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Siddheshdewalekar21/restaurant-os.git
   cd restaurant-os
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/restaurant_os"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   JWT_SECRET="your-jwt-secret"
   ```

4. Set up the database:
   ```bash
   npx prisma db push
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev:all
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Demo Credentials

- **Admin**: admin@restaurant.com / password123
- **Staff**: staff@restaurant.com / password123

## 📁 Project Structure

```
restaurant-os/
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── menu/          # Menu management
│   │   ├── orders/        # Order management
│   │   ├── tables/        # Table management
│   │   ├── inventory/     # Inventory management
│   │   ├── customers/     # Customer management
│   │   └── settings/      # System settings
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── .env                   # Environment variables
├── next.config.js         # Next.js configuration
└── package.json           # Project dependencies
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

The application can be deployed to Vercel with a single command:

```bash
npm run deploy
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name - Initial work

## �� Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Socket.io](https://socket.io/)
