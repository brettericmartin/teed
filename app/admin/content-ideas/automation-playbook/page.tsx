import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import AutomationPlaybookClient from './AutomationPlaybookClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Automation Playbook | Admin',
  description: 'Analysis of fully automating the discovery-to-posting pipeline',
};

export default async function AutomationPlaybookPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'automation-playbook',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <AutomationPlaybookClient />
    </>
  );
}
