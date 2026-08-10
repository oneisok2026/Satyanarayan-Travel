import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton';

/** Streamed while an admin page's data resolves. */
export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="mb-6 h-10 w-full max-w-2xl" />
      <TableSkeleton rows={8} />
    </div>
  );
}
