import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/firebase/auth';
import { getDashboardStats, getRecentActivity } from '@/services/admin.service';
import { PageHeading } from '@/components/admin/PageHeading';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin dashboard',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireAdminPage('/admin');

  const [stats, activity] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(8),
  ]);

  return (
    <>
      <PageHeading
        title="Dashboard"
        description={`Signed in as ${user.name} · ${user.role.replace('_', ' ')}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customers"
          value={stats.customers.total}
          hint={`${stats.customers.newThisMonth} new this month`}
          href="/admin/customers"
        />
        <StatCard
          label="Enquiries"
          value={stats.enquiries.total}
          hint={`${stats.enquiries.pending} awaiting reply`}
          href="/admin/enquiries"
          highlight={stats.enquiries.pending > 0}
        />
        <StatCard
          label="Bookings"
          value={stats.bookings.total}
          hint={`${stats.bookings.pending} pending confirmation`}
          href="/admin/bookings"
          highlight={stats.bookings.pending > 0}
        />
        <StatCard
          label="Confirmed revenue"
          value={formatPrice(stats.revenue.confirmedTotal)}
          hint={`${stats.bookings.confirmed} confirmed bookings`}
          href="/admin/bookings?status=confirmed"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Packages"
          value={stats.packages.total}
          hint={`${stats.packages.published} published`}
          href="/admin/packages"
        />
        <StatCard
          label="Featured packages"
          value={stats.packages.featured}
          hint="Shown on the homepage"
          href="/admin/packages?featured=true"
        />
      </div>

      <section className="mt-8" aria-labelledby="recent-activity">
        <h2
          id="recent-activity"
          className="mb-4 font-display text-lg font-semibold text-sand-900"
        >
          Recent activity
        </h2>

        {activity.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Enquiries and bookings will appear here as they arrive."
          />
        ) : (
          <ul className="divide-y divide-sand-100 overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200">
            {activity.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-sand-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-sand-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-sand-500">
                      {item.subtitle}
                    </p>
                  </div>
                  <time
                    dateTime={item.createdAt}
                    className="shrink-0 text-xs text-sand-500"
                  >
                    {formatDate(item.createdAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
  highlight = false,
}: {
  label: string;
  value: number | string;
  hint: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-2xl bg-white p-5 ring-1 transition-shadow hover:shadow-[var(--shadow-card)]',
        highlight ? 'ring-accent-300' : 'ring-sand-200',
      )}
    >
      <p className="text-sm text-sand-600">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-sand-900">{value}</p>
      <p className={cn('mt-1 text-xs', highlight ? 'text-accent-700' : 'text-sand-500')}>
        {hint}
      </p>
    </Link>
  );
}
