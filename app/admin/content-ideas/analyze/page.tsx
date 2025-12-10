import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import AnalyzeUrlClient from './AnalyzeUrlClient';
import { ROLE_PERMISSIONS } from '@/lib/types/admin';

export const dynamic = 'force-dynamic';

export default async function AnalyzeUrlPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  const permissions = ROLE_PERMISSIONS[admin.role];
  if (!permissions.canViewAnalytics) {
    redirect('/admin');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'analyze-url',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <AnalyzeUrlClient adminRole={admin.role} />
    </>
  );
}
