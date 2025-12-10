import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import UserManagementClient from './UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Log admin access
  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'users',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <UserManagementClient
        adminRole={admin.role}
        adminId={admin.id}
      />
    </>
  );
}
