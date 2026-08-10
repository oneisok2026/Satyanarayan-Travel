import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/firebase/auth';
import { toUserProfile } from '@/services/user.service';
import { ProfileForm } from '@/components/account/ProfileForm';
import { PasswordResetCard } from '@/components/account/PasswordResetCard';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'My profile',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const user = await requireUserPage('/account/profile');
  const profile = toUserProfile(user);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sand-900">My profile</h1>
        <p className="mt-1 text-sm text-sand-600">
          Keep your details current so we can reach you about your trips.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-sand-200">
          <ProfileForm profile={profile} />
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl bg-white p-5 ring-1 ring-sand-200">
            <h2 className="font-display text-lg font-semibold text-sand-900">
              Account
            </h2>
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs text-sand-500">Email address</dt>
                <dd className="mt-0.5 font-medium break-all text-sand-900">
                  {profile.email}
                </dd>
                <dd className="mt-1 text-xs">
                  {profile.emailVerified ? (
                    <span className="text-emerald-700">Verified</span>
                  ) : (
                    <span className="text-amber-700">Not verified</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-sand-500">Member since</dt>
                <dd className="mt-0.5 font-medium text-sand-900">
                  {formatDate(profile.createdAt)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-sand-500">
              Your email address is managed by your sign-in provider and cannot be
              changed here. Contact us if you need it updated.
            </p>
          </section>

          <PasswordResetCard email={profile.email} />
        </aside>
      </div>
    </div>
  );
}
