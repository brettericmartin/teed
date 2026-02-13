import { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminAuth';
import GPTSetupWizard from './GPTSetupWizard';

export const metadata: Metadata = {
  title: 'ChatGPT GPT Setup - Admin - Teed.club',
  description: 'Step-by-step guide to set up the Teed custom GPT for ChatGPT',
};

export default async function GPTSetupPage() {
  // Ensure user is admin
  await requireAdmin();

  return <GPTSetupWizard />;
}
