import { redirect } from 'next/navigation';

/**
 * DOCTRINE: Leaderboards are explicitly forbidden.
 * "Rankings, leaderboards, trending" are listed under "What Teed Will Never Build"
 *
 * This page redirects to the main apply page instead.
 */
export default function LeaderboardRedirect() {
  redirect('/apply');
}
