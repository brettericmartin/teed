import { redirect } from 'next/navigation';
import { getAdminUser, hasRole, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import AffiliateSettingsClient from './AffiliateSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AffiliateSettingsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Require admin role for affiliate settings
  if (!(await hasRole('admin'))) {
    redirect('/admin');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'affiliate-settings',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <AffiliateSettingsClient />
    </>
  );
}
