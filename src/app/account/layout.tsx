import { requireUserPage } from '@/lib/firebase/auth';
import { AccountNav } from '@/components/account/AccountNav';

/**
 * Customer area guard.
 *
 * Authorization happens here on the server, not in a client component: the
 * page never renders for an unauthenticated visitor, so there is no protected
 * markup to inspect in the response.
 */
export const dynamic = 'force-dynamic';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserPage('/account');

  return (
    <main id="main-content" className="container-page py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav userName={user.name} emailVerified={user.emailVerified} />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
