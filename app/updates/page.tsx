import { Metadata } from 'next';
import UpdatesPageClient from './UpdatesPageClient';

export const metadata: Metadata = {
  title: 'Updates - Teed.club',
  description: 'See what\'s new in Teed - the latest features, improvements, and bug fixes for your curation platform.',
};

export default function UpdatesPage() {
  return <UpdatesPageClient />;
}
