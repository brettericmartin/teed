import { Metadata } from 'next';
import JoinContent from './JoinContent';

export const metadata: Metadata = {
  title: 'Join Teed - Founding Member Access',
  description:
    'Apply for founding member access to Teed. Limited spots available for creators who want to curate and share their favorite products.',
  openGraph: {
    title: 'Join Teed - Founding Member Access',
    description: 'Limited spots available for founding members.',
  },
};

export const dynamic = 'force-dynamic';

export default function JoinPage() {
  return <JoinContent />;
}
