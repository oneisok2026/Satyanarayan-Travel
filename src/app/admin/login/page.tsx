import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase/auth';
import { ADMIN_ROLES } from '@/constants';

export const dynamic = 'force-dynamic';

/**
 * /admin/login exists because the spec lists it, but there is deliberately no
 * separate admin credential store: admins authenticate through the same
 * Firebase sign-in as everyone else, and authorization is decided by their
 * MongoDB role afterwards.
 *
 * A second login form would mean a second authentication path to secure, for
 * no benefit — so this redirects to the single one.
 */
export default async function AdminLoginPage() {
  const user = await getCurrentUser();

  if (user && ADMIN_ROLES.includes(user.role)) redirect('/admin');
  // Signed in but not an admin: send them to their own account rather than
  // confirming that an admin area exists.
  if (user) redirect('/account');

  redirect(`/login?next=${encodeURIComponent('/admin')}`);
}
