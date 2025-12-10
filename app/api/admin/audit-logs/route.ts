import { NextRequest, NextResponse } from 'next/server';
import { withAdminApi } from '@/lib/withAdmin';
import { getAuditLogs } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const action = searchParams.get('action') || undefined;
  const adminId = searchParams.get('adminId') || undefined;
  const targetType = searchParams.get('targetType') || undefined;
  const targetId = searchParams.get('targetId') || undefined;

  try {
    const { logs, total } = await getAuditLogs({
      limit,
      offset,
      action,
      adminId,
      targetType,
      targetId,
    });

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
