import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import IdentificationDashboard from './IdentificationDashboard';

export const metadata = {
  title: 'Identification Analytics | Teed Admin',
  description: 'Monitor product identification quality, telemetry, and corrections',
};

export default async function IdentificationPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/admin');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'identification',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Identification Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor product identification quality, user corrections, and learned products
          </p>
        </div>

        <IdentificationDashboard />
      </div>
    </div>
  );
}
