import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type {
  BookingStatus,
  EnquiryStatus,
  PaymentStatus,
  ReviewStatus,
  ContentStatus,
} from '@/constants';

type Tone = 'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-200',
  accent: 'bg-accent-50 text-accent-800 ring-accent-200',
  neutral: 'bg-sand-100 text-sand-700 ring-sand-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
        'text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Status → label + tone maps. Kept here so every surface renders a status
   identically, whether it's the customer dashboard or the admin table. */

const ENQUIRY_META: Record<EnquiryStatus, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'brand' },
  follow_up: { label: 'Follow up', tone: 'warning' },
  quoted: { label: 'Quoted', tone: 'accent' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

const BOOKING_META: Record<BookingStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Requested', tone: 'info' },
  pending_confirmation: { label: 'Pending confirmation', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  completed: { label: 'Completed', tone: 'brand' },
};

const PAYMENT_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: 'Unpaid', tone: 'neutral' },
  pending: { label: 'Payment pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Payment failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'info' },
};

const REVIEW_META: Record<ReviewStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const CONTENT_META: Record<ContentStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
};

export const StatusBadge = {
  Enquiry: ({ status }: { status: EnquiryStatus }) => (
    <Badge tone={ENQUIRY_META[status].tone}>{ENQUIRY_META[status].label}</Badge>
  ),
  Booking: ({ status }: { status: BookingStatus }) => (
    <Badge tone={BOOKING_META[status].tone}>{BOOKING_META[status].label}</Badge>
  ),
  Payment: ({ status }: { status: PaymentStatus }) => (
    <Badge tone={PAYMENT_META[status].tone}>{PAYMENT_META[status].label}</Badge>
  ),
  Review: ({ status }: { status: ReviewStatus }) => (
    <Badge tone={REVIEW_META[status].tone}>{REVIEW_META[status].label}</Badge>
  ),
  Content: ({ status }: { status: ContentStatus }) => (
    <Badge tone={CONTENT_META[status].tone}>{CONTENT_META[status].label}</Badge>
  ),
};
