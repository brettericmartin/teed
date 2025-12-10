import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import SetupGuidesClient from './SetupGuidesClient';

export const dynamic = 'force-dynamic';

export default async function SetupGuidesPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'setup-guides',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <SetupGuidesClient />
    </>
  );
}
