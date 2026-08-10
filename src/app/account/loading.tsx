import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton';

/** Streamed while an account page's data resolves. */
export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}
