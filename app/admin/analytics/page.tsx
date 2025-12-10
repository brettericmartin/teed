import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import AnalyticsDashboard from './AnalyticsDashboard';

export const metadata = {
  title: 'Analytics Dashboard | Teed Admin',
  description: 'View API usage, costs, and platform analytics',
};

export default async function AnalyticsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/admin');
  }

  // Log the page view
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'analytics',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor API usage, costs, and platform metrics
          </p>
        </div>

        <AnalyticsDashboard adminRole={admin.role} />
      </div>
    </div>
  );
}
