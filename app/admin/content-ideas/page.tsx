import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import ContentIdeasClient from './ContentIdeasClient';
import { ROLE_PERMISSIONS } from '@/lib/types/admin';

export const dynamic = 'force-dynamic';

export default async function AdminContentIdeasPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Check if user has permission to access content ideas
  const permissions = ROLE_PERMISSIONS[admin.role];
  if (!permissions.canViewAnalytics) {
    redirect('/admin');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'content-ideas',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <ContentIdeasClient adminRole={admin.role} adminId={admin.id} />
    </>
  );
}
