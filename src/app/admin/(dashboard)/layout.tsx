import { requireAdminPage } from '@/lib/firebase/auth';
import { AdminNav } from '@/components/admin/AdminNav';
import { ToastProvider } from '@/components/ui/Toast';

/**
 * Admin area guard.
 *
 * requireAdminPage returns 404 rather than 403 for signed-in non-admins, so
 * the admin surface does not confirm its own existence to a customer probing
 * URLs. Every admin API route repeats the check independently.
 */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage('/admin');

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-sand-100">
        <div className="flex">
          <AdminNav role={user.role} />
          <main
            id="main-content"
            className="min-w-0 flex-1 p-5 pt-16 lg:p-8 lg:pt-8"
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
