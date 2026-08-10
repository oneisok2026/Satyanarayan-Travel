import { CardGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

/** Default route-level loading UI. Specific routes override with their own. */
export default function Loading() {
  return (
    <main className="container-page py-16" aria-busy="true">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <CardGridSkeleton count={6} />
    </main>
  );
}
