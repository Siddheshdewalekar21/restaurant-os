import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                RestaurantOS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
              <div className="relative z-10 px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
                <div className="max-w-3xl">
                  <h2 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl drop-shadow-md">
                    Transform Your Restaurant Operations
                  </h2>
                  <p className="mt-6 text-xl text-indigo-100 max-w-2xl">
                    RestaurantOS is your all-in-one solution for modern restaurant management. 
                    From orders to analytics, we've got everything covered.
                  </p>
                  <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/auth/signin"
                      className="flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Get Started Free
                    </Link>
                    <a
                      href="#features"
                      className="flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-200"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Decorative blob shapes */}
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 transform">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full filter blur-3xl"></div>
              </div>
              <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 transform">
                <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full filter blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative -mt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Active Users', value: '1000+' },
              { label: 'Orders Processed', value: '1M+' },
              { label: 'Restaurants', value: '500+' },
              { label: 'Customer Satisfaction', value: '99%' },
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center transform hover:-translate-y-1 transition-all duration-200">
                <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Section */}
        <div id="features" className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Everything you need to succeed
              </p>
              <p className="mt-4 text-lg text-gray-500">
                RestaurantOS provides a complete suite of tools to manage your restaurant efficiently.
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Smart Order Management',
                    description: 'Handle orders efficiently with real-time tracking, status updates, and seamless kitchen integration.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )
                  },
                  {
                    title: 'Interactive Table Management',
                    description: 'Visualize your floor plan, manage reservations, and track table status in real-time.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                    )
                  },
                  {
                    title: 'Smart Inventory Control',
                    description: 'Track stock levels automatically, get low inventory alerts, and manage suppliers efficiently.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    )
                  },
                  {
                    title: 'Secure Payment Processing',
                    description: 'Accept multiple payment methods, handle split bills, and generate detailed invoices instantly.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Customer Relationship',
                    description: 'Build loyalty with customer profiles, order history, and personalized promotions.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Powerful Analytics',
                    description: 'Make data-driven decisions with comprehensive reports and real-time analytics.',
                    icon: (
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )
                  }
                ].map((feature, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 transform rotate-1 group-hover:rotate-2 transition-transform duration-200"></div>
                    <div className="relative h-full bg-white p-6 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to transform your restaurant?
              </h2>
              <p className="mt-4 text-lg text-indigo-100">
                Join thousands of restaurants already using RestaurantOS to grow their business.
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#features" className="text-base text-gray-500 hover:text-gray-900">Features</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; {new Date().getFullYear()} RestaurantOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
