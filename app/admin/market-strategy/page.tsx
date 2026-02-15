import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import MarketStrategyClient from './MarketStrategyClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '30-Day Market Strategy | Admin',
  description: 'Seed bags, distribution playbook, scripts, and calendar',
};

export default async function MarketStrategyPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'market-strategy',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <MarketStrategyClient />
    </>
  );
}
