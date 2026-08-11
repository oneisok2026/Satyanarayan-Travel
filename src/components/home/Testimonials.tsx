import { Section, SectionHeading } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Rating } from '@/components/ui/Rating';
import { cn } from '@/lib/utils';
import type { ReviewDTO } from '@/types';

/**
 * Testimonials strip.
 *
 * Renders approved reviews from the database when they exist. Until the
 * agency has collected real reviews, the section is hidden entirely rather
 * than filled with invented quotes.
 */
export function Testimonials({ reviews }: { reviews: ReviewDTO[] }) {
  if (reviews.length === 0) return null;

  return (
    <Section tone="brand" aria-labelledby="testimonials-heading">
      <SectionHeading
        id="testimonials-heading"
        eyebrow="Traveller stories"
        title="What our travellers say"
        description="Reviews from customers who booked and travelled with us."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((review, index) => (
          <ScrollReveal key={review.id} delay={index * 60}>
            <figure
              className={cn(
                'flex h-full flex-col rounded-2xl bg-white p-6 shadow-[--shadow-card]',
                'ring-1 ring-accent-600/25 transition-[box-shadow,transform] duration-300',
                'ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-1 hover:shadow-[--shadow-card-hover] hover:ring-accent-600/60',
                'motion-reduce:transform-none motion-reduce:transition-none',
              )}
            >
              <Rating value={review.rating} size="sm" />

              {review.title && (
                <figcaption className="mt-3 font-display font-semibold text-sand-900">
                  {review.title}
                </figcaption>
              )}

              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-sand-600">
                <p className="line-clamp-5">{review.comment}</p>
              </blockquote>

              <figcaption className="mt-4 flex items-center gap-3 border-t border-sand-200 pt-4">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 font-medium text-brand-800"
                >
                  {review.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sand-900">
                    {review.authorName}
                  </p>
                  {review.packageRef && (
                    <p className="truncate text-xs text-sand-500">
                      {review.packageRef.title}
                    </p>
                  )}
                </div>
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </Section>
  );
}
