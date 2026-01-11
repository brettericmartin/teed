'use client';

import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import CreatorEconomicsDashboard from '@/components/creator/CreatorEconomicsDashboard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { PageContainer, ContentContainer } from '@/components/layout/PageContainer';

type Profile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

interface CreatorStatsClientProps {
  profile: Profile;
}

export default function CreatorStatsClient({ profile }: CreatorStatsClientProps) {
  return (
    <PageContainer variant="warm">
      {/* Header */}
      <div className="bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)]">
        <ContentContainer size="md" className="py-4">
          <Breadcrumbs
            items={[
              { label: profile.display_name || profile.handle, href: `/u/${profile.handle}`, icon: <User className="w-4 h-4" /> },
              { label: 'Creator Stats' },
            ]}
            showHome={false}
          />

          <div className="flex items-center gap-4 mt-3">
            <Link
              href={`/u/${profile.handle}`}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Your Impact Dashboard
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                See how your curations are helping others
              </p>
            </div>
          </div>
        </ContentContainer>
      </div>

      {/* Main Content */}
      <ContentContainer size="md" className="py-8">
        <CreatorEconomicsDashboard ownerHandle={profile.handle} />
      </ContentContainer>

      {/* Footer */}
      <ContentContainer size="md" className="py-8 border-t border-[var(--border-subtle)]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            Your stats are private and only visible to you.
          </p>
        </div>
      </ContentContainer>
    </PageContainer>
  );
}
