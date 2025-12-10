import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import FeedbackManagementClient from './FeedbackManagementClient';

export const dynamic = 'force-dynamic';

export default async function FeedbackManagementPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'feedback',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <FeedbackManagementClient adminRole={admin.role} />
    </>
  );
}
