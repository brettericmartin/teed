import { createServerSupabase } from './serverSupabase';

const ADMIN_EMAIL = 'brett.eric.martin@gmail.com';

export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return user.email === ADMIN_EMAIL;
  } catch (error) {
    console.error('Admin auth check error:', error);
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
  return true;
}
