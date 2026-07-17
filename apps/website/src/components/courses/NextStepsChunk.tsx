import {
  ErrorSection, H2, P, ProgressDots,
} from '@bluedot/ui';
import type React from 'react';
import { PageListGroup, PageListRow } from '../PageListRow';
import { isDigitalMindsCourseSlug } from '../../lib/constants';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const pluralizeGrants = (count: number) => `${count} ${count === 1 ? 'grant' : 'grants'}`;

type NextStepsChunkProps = {
  courseSlug: string;
};

const externalLinkClassName = 'font-semibold text-bluedot-normal underline hover:text-bluedot-navy';

const DigitalMindsNextStepsChunk: React.FC = () => (
  <div className="next-steps-chunk flex flex-col gap-6 mt-8 md:mt-6">
    <P className="text-size-sm leading-relaxed text-bluedot-navy">
      Congratulations on finishing the Introduction to Digital Minds course! Here are some ways you can continue to learn about and contribute to the digital minds field.
    </P>

    <div className="flex flex-col gap-5 text-size-sm leading-relaxed text-bluedot-navy">
      <div>
        <a
          href="https://www.digitalminds.news/"
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClassName}
        >
          Cambridge Digital Minds Newsletter
        </a>
        <p className="mt-1">
          A quarterly round-up of the latest news and research on AI consciousness, moral status and digital minds
        </p>
      </div>

      <div>
        <a
          href="https://digitalminds.cam/fellowship/"
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClassName}
        >
          Cambridge Digital Minds Fellowship
        </a>
        <p className="mt-1">
          In person workshops and mentorship on projects. Sign up to the CDM Newsletter to hear when applications open.
        </p>
      </div>

      <div>
        <H2 className="text-size-sm">Other fellowships and opportunities</H2>
        <p className="mt-1">
          The{' '}
          <a
            href="https://digitalminds.guide/events"
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClassName}
          >
            Beginner’s Guide to Digital Minds
          </a>
          {' '}has a really helpful list. Also, keep an eye on programmes with organisations like{' '}
          <a
            href="https://futureimpact.group/ai-sentience"
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClassName}
          >
            Future Impact Group
          </a>
          ,{' '}
          <a
            href="https://www.matsprogram.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClassName}
          >
            MATS
          </a>
          ,{' '}
          <a
            href="https://www.sentientfutures.ai/projectincubator"
            target="_blank"
            rel="noopener noreferrer"
            className={externalLinkClassName}
          >
            Sentient Futures
          </a>
          .
        </p>
      </div>
    </div>
  </div>
);

const BlueDotNextStepsChunk: React.FC = () => {
  const { data: programs, isLoading, error } = trpc.programs.getAll.useQuery();
  const { data: rapidStats } = trpc.grants.getRapidGrantStats.useQuery();
  const { data: ctStats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  const getMeta = (slug: string | null): string | null => {
    if (slug === 'rapid-grants' && rapidStats) {
      return `${formatAmountUsd(rapidStats.totalAmountUsd)} deployed so far across ${pluralizeGrants(rapidStats.count)}.`;
    }

    if (slug === 'career-transition-grant' && ctStats) {
      return `${formatAmountUsd(ctStats.totalAmountUsd)} awarded so far across ${pluralizeGrants(ctStats.count)}.`;
    }

    return null;
  };

  return (
    <div className="next-steps-chunk flex flex-col gap-6 mt-8 md:mt-6">
      <P className="text-size-sm leading-relaxed text-bluedot-navy">
        You&apos;ve got context now. Here&apos;s how you can continue contributing to AI safety.
      </P>

      {error && <ErrorSection error={error} />}
      {isLoading && <ProgressDots />}
      {!isLoading && !error && programs && (
        <PageListGroup>
          {programs.map((program) => (
            <PageListRow
              key={program.id}
              href={program.slug ? `/programs/${program.slug}` : (program.applicationForm ?? '#')}
              title={program.name}
              summary={program.description}
              meta={getMeta(program.slug)}
              ctaLabel="Explore program"
            />
          ))}
        </PageListGroup>
      )}
    </div>
  );
};

const NextStepsChunk: React.FC<NextStepsChunkProps> = ({ courseSlug }) => (
  isDigitalMindsCourseSlug(courseSlug)
    ? <DigitalMindsNextStepsChunk />
    : <BlueDotNextStepsChunk />
);

export default NextStepsChunk;
