import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/firebase/auth';
import { VerifyEmailNotice } from '@/components/account/VerifyEmailNotice';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await requireUserPage('/account');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-sand-900">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-sand-600">
          Track your enquiries, bookings and saved packages here.
        </p>
      </div>

      {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Bookings" value="0" href="/account/bookings" />
        <StatCard label="Enquiries" value="0" href="/account/enquiries" />
        <StatCard label="Favourites" value="0" href="/account/favourites" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl bg-white p-5 ring-1 ring-sand-200/70 transition-shadow hover:shadow-[--shadow-card]"
    >
      <p className="text-sm text-sand-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-sand-900">{value}</p>
    </a>
  );
}
