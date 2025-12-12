import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import UnrecognizedDomainsClient from './UnrecognizedDomainsClient';

export const dynamic = 'force-dynamic';

export default async function UnrecognizedDomainsPage() {
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
      <UnrecognizedDomainsClient />
    </>
  );
}
