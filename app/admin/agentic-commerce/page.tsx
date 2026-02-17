import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import AgenticCommerceClient from './AgenticCommerceClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Agentic Commerce Deep Dive | Admin',
  description: 'AI shopping landscape analysis, competitive moat assessment, and user capture strategies',
};

export default async function AgenticCommercePage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'agentic-commerce',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <AgenticCommerceClient />
    </>
  );
}
