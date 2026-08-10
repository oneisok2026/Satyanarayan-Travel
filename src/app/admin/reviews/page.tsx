import type { Metadata } from 'next';
import { z } from 'zod';
import { requireAdminPage } from '@/lib/firebase/auth';
import { connectToDatabase } from '@/lib/db/connect';
import { Review } from '@/models/Review';
import { toReviewDTO } from '@/services/mappers';
import { paginationSchema, offsetFor } from '@/lib/validation/common.schema';
import Link from 'next/link';
import { PageHeading } from '@/components/admin/PageHeading';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Pagination } from '@/components/ui/Pagination';
import { ReviewModeration } from '@/components/admin/ReviewModeration';
import { cn, formatDate, truncate } from '@/lib/utils';
import { REVIEW_STATUSES } from '@/constants';
import type { ReviewDTO } from '@/types';

export const metadata: Metadata = {
  title: 'Reviews',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  status: z.enum(REVIEW_STATUSES).optional(),
});

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage('/admin/reviews');

  const raw = await searchParams;
  const parsed = querySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : querySchema.parse({});

  await connectToDatabase();

  const filter = query.status ? { status: query.status } : {};

  const [documents, total] = await Promise.all([
    Review.find(filter)
      .populate('packageId', 'title slug')
      .sort({ createdAt: -1 })
      .skip(offsetFor(query.page, query.limit))
      .limit(query.limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const reviews = documents.map(toReviewDTO);
  const totalPages = Math.ceil(total / query.limit);

  const columns: Column<ReviewDTO>[] = [
    {
      key: 'author',
      header: 'Reviewer',
      render: (review) => (
        <div className="min-w-0">
          <p className="font-medium text-sand-900">{review.authorName}</p>
          <p className="truncate text-xs text-sand-500">
            {review.packageRef?.title ?? 'General review'}
          </p>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (review) => <Rating value={review.rating} size="sm" />,
    },
    {
      key: 'comment',
      header: 'Review',
      render: (review) => (
        <div className="max-w-md">
          {review.title && (
            <p className="text-sm font-medium text-sand-900">{review.title}</p>
          )}
          <p className="text-sm text-sand-600">{truncate(review.comment, 140)}</p>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      secondary: true,
      render: (review) => formatDate(review.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (review) => <StatusBadge.Review status={review.status} />,
    },
    {
      key: 'actions',
      header: 'Moderate',
      align: 'right',
      render: (review) => (
        <ReviewModeration reviewId={review.id} status={review.status} />
      ),
    },
  ];

  return (
    <>
      <PageHeading
        title="Reviews"
        description="Approved reviews appear publicly and update the package rating."
      />

      <StatusTabs current={query.status} />

      <DataTable
        columns={columns}
        rows={reviews}
        rowKey={(review) => review.id}
        empty={{
          title: 'No reviews found',
          description:
            'Customers can review a package after travelling with you on it.',
        }}
      />

      {totalPages > 1 && (
        <Pagination
          className="mt-8"
          page={query.page}
          totalPages={totalPages}
          buildHref={(target) => {
            const params = new URLSearchParams();
            if (query.status) params.set('status', query.status);
            if (target > 1) params.set('page', String(target));
            const qs = params.toString();
            return qs ? `/admin/reviews?${qs}` : '/admin/reviews';
          }}
        />
      )}
    </>
  );
}

/** Link-based status tabs — no client JS needed for a four-option filter. */
function StatusTabs({ current }: { current?: string }) {
  const tabs = [
    { value: undefined, label: 'All' },
    ...REVIEW_STATUSES.map((status) => ({
      value: status,
      label: status.replace(/^\w/, (c) => c.toUpperCase()),
    })),
  ];

  return (
    <nav aria-label="Filter reviews" className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = tab.value ? `/admin/reviews?status=${tab.value}` : '/admin/reviews';
        const active = current === tab.value;

        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-700 text-white'
                : 'bg-white text-sand-700 ring-1 ring-sand-200 hover:bg-sand-50',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
