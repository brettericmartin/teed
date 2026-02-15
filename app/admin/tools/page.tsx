import { redirect } from 'next/navigation';
import { getAdminUser, logAdminAction } from '@/lib/adminAuth';
import Navigation from '@/components/Navigation';
import VideoToBagFlow from '@/components/video-to-bag/VideoToBagFlow';

export const dynamic = 'force-dynamic';

export default async function AdminToolsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  await logAdminAction(admin, 'admin.login', null, null, {
    page: 'tools',
  });

  return (
    <>
      <Navigation
        userHandle={admin.handle}
        displayName={admin.displayName}
        isAuthenticated={true}
        isAdmin={true}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
          <p className="text-sm text-gray-500 mt-1">
            Power tools for content creation and curation
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <VideoToBagFlow />
        </div>
      </main>
    </>
  );
}
