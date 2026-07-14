import { useState } from 'react';
import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import clsx from 'clsx';
import { trpc } from '../../utils/trpc';
import type { TransformedTestimonial } from '../../server/routers/testimonials';
import AlumniAvatar from './AlumniAvatar';

const COLLAPSED_ROWS = 3;
const COLS_LG = 3;

const RecentAlumniList = () => {
  const { data } = trpc.testimonials.getCommunityMembers.useQuery();
  const [expanded, setExpanded] = useState(false);

  const alumni = (data ?? [])
    .filter((t) => !(t.storyUrl && t.quote))
    .sort((a, b) => Number(!!b.storyUrl) - Number(!!a.storyUrl));

  if (alumni.length === 0) return null;

  const collapsedCount = COLLAPSED_ROWS * COLS_LG;
  const hasMore = alumni.length > collapsedCount;
  const visible = expanded || !hasMore ? alumni : alumni.slice(0, collapsedCount);

  return (
    <section className="w-full bg-white py-12 bd-md:py-16 lg:py-20">
      <div className="max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x">
        <div className="flex flex-col gap-2 mb-8 bd-md:mb-12">
          <p className="text-size-xxs font-semibold uppercase tracking-[0.14em] text-bluedot-navy/60">
            More stories
          </p>
          <H2 className="text-size-xl font-semibold leading-snug text-bluedot-navy">
            Some of our alumni
          </H2>
        </div>
        <ul className="grid grid-cols-1 bd-md:grid-cols-2 lg:grid-cols-3 gap-x-10">
          {visible.map((alum, index) => (
            <li key={`${alum.name}-${alum.jobTitle}-${index}`}>
              <AlumniRow alum={alum} />
            </li>
          ))}
        </ul>
        {hasMore && (
          <div className="flex justify-center mt-10">
            <CTALinkOrButton
              variant="secondary"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'See fewer' : `See more (${alumni.length - collapsedCount})`}
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </section>
  );
};

const AlumniRow = ({ alum }: { alum: TransformedTestimonial }) => {
  const linkHref = alum.storyUrl ?? alum.url;

  const content = (
    <div className="flex items-center gap-3 py-3.5 border-b border-bluedot-navy/10">
      <AlumniAvatar
        name={alum.name}
        imageSrc={alum.imageSrc}
        className="size-11 text-size-xs"
      />
      <div className="flex-1 min-w-0">
        <P className="text-size-sm font-semibold leading-tight text-bluedot-navy truncate">{alum.name}</P>
        <P className="text-size-xs text-bluedot-navy/60 truncate">{alum.jobTitle}</P>
      </div>
      {linkHref && (
        <span className="text-size-lg text-bluedot-normal flex-shrink-0" aria-hidden="true">→</span>
      )}
    </div>
  );

  if (linkHref) {
    return (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'block group',
          'hover:bg-bluedot-navy/[0.02] transition-colors',
        )}
      >
        {content}
      </a>
    );
  }

  return content;
};

export default RecentAlumniList;
