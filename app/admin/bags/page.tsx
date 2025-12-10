import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import BagControlClient from './BagControlClient';
import { ROLE_PERMISSIONS } from '@/lib/types/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBagsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Check if user has permission to access bag control
  const permissions = ROLE_PERMISSIONS[admin.role];
  if (!permissions.canHideContent) {
    redirect('/admin');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'bags',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <BagControlClient adminRole={admin.role} />
    </>
  );
}
