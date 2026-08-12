'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';
import { CONTACT } from '@/constants/navigation';
import { buildWhatsAppUrl } from '@/lib/utils';

interface PackageEnquiryPanelProps {
  packageId: string;
  packageTitle: string;
  price: number;
  compareAtPrice?: number;
  priceNote?: string;
  duration: string;
  brochureUrl?: string;
}

/** Sticky pricing and enquiry panel on the package detail page. */
export function PackageEnquiryPanel({
  packageId,
  packageTitle,
  price,
  compareAtPrice,
  priceNote,
  duration,
  brochureUrl,
}: PackageEnquiryPanelProps) {
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const whatsappUrl = buildWhatsAppUrl(
    CONTACT.whatsapp,
    `Hello! I'm interested in the "${packageTitle}" package.`,
  );

  return (
    <>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-sand-200">
          <p className="text-xs tracking-wide text-sand-500 uppercase">Starting from</p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-sand-900">
              {formatPrice(price)}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-sand-400 line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>

          {priceNote && <p className="mt-1 text-xs text-sand-500">{priceNote}</p>}

          <dl className="mt-5 flex flex-col gap-2.5 border-y border-sand-200 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-sand-600">Duration</dt>
              <dd className="font-medium text-sand-900">{duration}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sand-600">Booking</dt>
              <dd className="font-medium text-sand-900">Agency confirmed</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button size="lg" fullWidth onClick={() => setEnquiryOpen(true)}>
              Enquire about this trip
            </Button>

            <ButtonLink
              href={whatsappUrl}
              external
              variant="whatsapp"
              size="lg"
              fullWidth
              aria-label="Ask about this package on WhatsApp"
            >
              Ask on WhatsApp
            </ButtonLink>

            {brochureUrl && (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="mt-1 text-center text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
              >
                Download brochure (PDF)
              </a>
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-sand-500">
            No payment required to enquire. We respond within one working day.
          </p>
        </div>
      </aside>

      <Modal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        title="Enquire about this package"
        description={packageTitle}
        size="lg"
      >
        <EnquiryForm
          type="package"
          packageId={packageId}
          onSuccess={() => {
            // Leave the confirmation visible briefly before closing.
            window.setTimeout(() => setEnquiryOpen(false), 3500);
          }}
        />
      </Modal>
    </>
  );
}
