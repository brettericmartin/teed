import { NextRequest, NextResponse } from 'next/server';
import { withAdminApi } from '@/lib/withAdmin';
import { updateUserRole, type AdminRole } from '@/lib/adminAuth';

export async function PUT(request: NextRequest) {
  const result = await withAdminApi('super_admin');
  if ('error' in result) return result.error;

  const { admin } = result;

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles: (AdminRole | null)[] = ['super_admin', 'admin', 'moderator', null];
    if (role !== null && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Cannot promote to super_admin
    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot promote to super_admin' },
        { status: 403 }
      );
    }

    const updateResult = await updateUserRole(admin, userId, role);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
