import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import ProposalsClient from './ProposalsClient';

export const dynamic = 'force-dynamic';

export default async function ProposalsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'proposals',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <ProposalsClient adminRole={admin.role} />
    </>
  );
}
