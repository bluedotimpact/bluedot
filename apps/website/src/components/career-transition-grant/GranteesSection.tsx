import {
  CTALinkOrButton, H3, H4, P,
} from '@bluedot/ui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AlumniAvatar from '../alumni/AlumniAvatar';
import { trpc } from '../../utils/trpc';

const COLLAPSED_ROWS = 3;

type GranteeCardProps = {
  name: string;
  bio: string;
  plan: string;
  imageUrl?: string;
  profileUrl?: string | null;
};

const cardClass = 'group flex h-full flex-col rounded-lg border border-bluedot-navy/10 bg-white p-5 transition-colors hover:border-bluedot-navy/20';

const GranteeCard = ({ name, bio, plan, imageUrl, profileUrl }: GranteeCardProps) => {
  const cardContent = (
    <>
      <div className="flex items-center gap-4">
        <AlumniAvatar name={name} imageSrc={imageUrl} className="size-14 text-size-md" />
        <div className="flex min-w-0 flex-col">
          <H4 className="text-size-sm">
            {name}
          </H4>
          {bio && (
            <p className="mt-1 text-size-xs leading-normal text-bluedot-navy/68">
              {bio}
            </p>
          )}
        </div>
      </div>
      {plan && (
        <P className="mt-4 text-size-xs leading-relaxed text-bluedot-navy/74">
          {plan}
        </P>
      )}
      {profileUrl && (
        <span className="mt-auto pt-4 text-size-xs font-medium text-bluedot-navy/68 transition-colors group-hover:text-bluedot-navy">
          View profile →
        </span>
      )}
    </>
  );

  if (profileUrl) {
    return <Link href={profileUrl} className={cardClass}>{cardContent}</Link>;
  }

  return <div className={cardClass}>{cardContent}</div>;
};

// Column count for the current viewport, matching the grid classes below
// (bd-md = 680px, 3-col at 1120px). Defaults to desktop during SSR.
const getGridColumns = (): number => {
  if (typeof window === 'undefined') return 3;
  if (window.matchMedia('(min-width: 1120px)').matches) return 3;
  return window.matchMedia('(min-width: 680px)').matches ? 2 : 1;
};

// Tracks the grid's column count so the collapsed view shows exactly
// COLLAPSED_ROWS rows at any width. Initialised from the viewport so the
// collapsed count is correct on first paint (no flash of the wrong row count).
const useGridColumns = (): number => {
  const [columns, setColumns] = useState(getGridColumns);

  useEffect(() => {
    const tablet = window.matchMedia('(min-width: 680px)');
    const desktop = window.matchMedia('(min-width: 1120px)');
    const update = () => setColumns(getGridColumns());

    update();
    tablet.addEventListener('change', update);
    desktop.addEventListener('change', update);
    return () => {
      tablet.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    };
  }, []);

  return columns;
};

const GranteesSection = () => {
  const { data: grantees } = trpc.grants.getAllPublicCareerTransitionGrantees.useQuery();
  const [expanded, setExpanded] = useState(false);
  const columns = useGridColumns();

  const allGrantees = grantees ?? [];

  if (allGrantees.length === 0) return null;

  const collapsedCount = columns * COLLAPSED_ROWS;
  const isCollapsible = allGrantees.length > collapsedCount;
  const visibleGrantees = expanded ? allGrantees : allGrantees.slice(0, collapsedCount);

  return (
    <section className="section section-body career-transition-grant-grantees-section">
      <div className="w-full flex flex-col gap-6">
        <H3>Some of our grantees</H3>
        <ul className="list-none grid gap-4 grid-cols-1 bd-md:grid-cols-2 min-[1120px]:grid-cols-3">
          {visibleGrantees.map((g) => (
            <li key={g.granteeName} className="h-full">
              <GranteeCard
                name={g.granteeName}
                bio={g.bio ?? ''}
                plan={g.grantPlan ?? ''}
                imageUrl={g.imageUrl}
                profileUrl={g.profileUrl}
              />
            </li>
          ))}
        </ul>
        {isCollapsible && (
          <div className="flex justify-center">
            <CTALinkOrButton
              variant="secondary"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? 'Show fewer' : `Show ${allGrantees.length - collapsedCount} more`}
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </section>
  );
};

export default GranteesSection;
