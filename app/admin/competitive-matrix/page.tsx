import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import CompetitiveMatrixClient from './CompetitiveMatrixClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Competitive Matrix | Admin',
  description: 'Feature comparison across creator platforms with actionable user capture strategies',
};

export default async function CompetitiveMatrixPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'competitive-matrix',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <CompetitiveMatrixClient />
    </>
  );
}
