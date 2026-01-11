import { Metadata } from 'next';
import SuccessContent from './SuccessContent';

export const metadata: Metadata = {
  title: "You're on the List - Teed",
  description: 'Your application has been submitted. We review applications weekly.',
};

export default function SuccessPage() {
  return <SuccessContent />;
}
