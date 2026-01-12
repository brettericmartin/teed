import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import DiscoveryDashboardClient from './DiscoveryDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Discovery Team | Admin',
  description: 'Automated content discovery and bag curation',
};

export default async function DiscoveryAdminPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.discovery.view', null, null, {
    page: 'discovery',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <DiscoveryDashboardClient />
    </>
  );
}
