import { Metadata } from 'next';
import ConsentClient from './ConsentClient';

export const metadata: Metadata = {
  title: 'Authorize Application - Teed.club',
  description: 'Authorize an application to access your Teed account',
};

export default function ConsentPage() {
  return <ConsentClient />;
}
