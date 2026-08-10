import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/firebase/auth';

export const metadata: Metadata = {
  title: 'Admin dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireAdminPage('/admin');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-sand-900">Dashboard</h1>
        <p className="mt-1 text-sm text-sand-600">
          Signed in as {user.name} · {user.role.replace('_', ' ')}
        </p>
      </div>

      <div className="rounded-xl bg-white p-6 ring-1 ring-sand-200/70">
        <p className="text-sm text-sand-600">
          Statistics appear here once packages, enquiries and bookings exist.
        </p>
      </div>
    </div>
  );
}
