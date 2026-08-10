import { PageHero } from './PageHero';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalPageProps {
  title: string;
  description: string;
  crumbLabel: string;
  href: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/** Shared shell for the policy pages, so all three read consistently. */
export function LegalPage({
  title,
  description,
  crumbLabel,
  href,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        description={description}
        crumbs={[{ href, label: crumbLabel }]}
      />

      <div className="container-page py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-10 text-sm text-sand-500">Last updated: {lastUpdated}</p>

          <div className="flex flex-col gap-9">
            {sections.map((section, index) => (
              <section key={section.heading}>
                <h2 className="font-display text-xl font-semibold text-sand-900">
                  {index + 1}. {section.heading}
                </h2>

                {section.paragraphs?.map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className="mt-3 text-[0.9375rem] leading-relaxed text-sand-600"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] leading-relaxed text-sand-600">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-sand-100 p-6">
            <p className="text-sm leading-relaxed text-sand-700">
              These terms are provided as a general template and should be reviewed by
              a qualified legal professional before the site goes live, so they reflect
              your actual business practices and comply with applicable law.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
