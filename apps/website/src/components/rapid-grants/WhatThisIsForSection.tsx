import Link from 'next/link';
import { useGrantApplicationUrl } from '../grants/useGrantApplicationUrl';

const FUNDING_EXAMPLES = [
  { title: 'Research and learning', description: 'Time, living costs and research access' },
  { title: 'Projects and experiments', description: 'Compute, tools and testing an idea' },
  { title: 'Events and community', description: 'Meetups, venues and bringing people together' },
  { title: 'Travel and collaboration', description: 'Conferences, collaboration and fieldwork' },
];

const WhatThisIsForSection = () => {
  const applicationUrl = useGrantApplicationUrl('rapid-grants');

  return (
    <section className="section-base rapid-grants-what-section">
      <div className="flex flex-col gap-6 border-b border-bluedot-navy/15 py-10 bd-md:py-12">
        <h2 className="text-size-lg font-medium tracking-tight">What we fund</h2>
        <div>
          <dl className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-8 gap-y-6 mb-7">
            {FUNDING_EXAMPLES.map((example) => (
              <div key={example.title}>
                <dt className="text-size-sm font-medium">{example.title}</dt>
                <dd className="mt-1 text-size-sm text-secondary leading-relaxed">{example.description}</dd>
              </div>
            ))}
          </dl>
          <p className="text-size-sm leading-relaxed max-w-[760px]">
            We look for a worthwhile direction, evidence you can make progress, and a clear role for funding.
            Wildcards welcome. If in doubt,{' '}
            {applicationUrl ? (
              <a href={applicationUrl} target="_blank" rel="noopener noreferrer" className="text-bluedot-normal underline underline-offset-4">apply</a>
            ) : 'apply'}.
          </p>
          <p className="mt-4 text-size-xs leading-relaxed text-secondary">
            Looking for support to move into AI safety or biosecurity full-time? See our{' '}
            <Link href="/grants/career-transition" className="text-bluedot-normal underline underline-offset-4">Career Transition Grants</Link>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatThisIsForSection;
