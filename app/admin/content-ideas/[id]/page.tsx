import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import ContentIdeaDetailClient from './ContentIdeaDetailClient';
import { ROLE_PERMISSIONS } from '@/lib/types/admin';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminContentIdeaDetailPage({ params }: PageProps) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  // Check if user has permission
  const permissions = ROLE_PERMISSIONS[admin.role];
  if (!permissions.canViewAnalytics) {
    redirect('/admin');
  }

  const { id } = await params;

  // Log admin access
  await logAdminAction(admin, 'admin.login', 'content_ideas', id, {
    page: 'content-idea-detail',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <ContentIdeaDetailClient adminRole={admin.role} adminId={admin.id} ideaId={id} />
    </>
  );
}
