import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import StrategyDashboardClient from './StrategyDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Strategic Roadmap | Teed Admin',
  description: 'Advisory panel insights, competitive analysis, and product roadmap',
};

export default async function StrategyPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <StrategyDashboardClient adminRole={admin.role} />
    </>
  );
}
