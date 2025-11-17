import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import UserProfileClient from './UserProfileClient';

type PageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function UserProfilePage({ params }: PageProps) {
  const { handle } = await params;

  // Fetch user profile and public bags
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(
    `${baseUrl}/api/users/${handle}/bags`,
    {
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();
  const { profile, bags } = data;

  return (
    <>
      <Navigation isAuthenticated={false} />
      <UserProfileClient profile={profile} bags={bags} />
    </>
  );
}
