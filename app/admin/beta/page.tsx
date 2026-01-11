import { withAdmin, AdminPageProps } from '@/lib/withAdmin';
import BetaDashboardClient from './BetaDashboardClient';

async function BetaAdminPage({ admin }: AdminPageProps) {
  return <BetaDashboardClient admin={admin} />;
}

export default withAdmin(BetaAdminPage, 'admin');
