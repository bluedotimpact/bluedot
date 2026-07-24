import type { ReactNode } from 'react';
import {
  A, H3, H4, P,
} from '@bluedot/ui';

type ScheduleItem = {
  cadence: string;
  title: string;
  body: ReactNode;
};

const SCHEDULE: ScheduleItem[] = [
  {
    cadence: 'Monday',
    title: 'Outcome and opportunities',
    body: 'Identify the gaps in the AI safety talent landscape. Talk to them and map the opportunities to help them contribute.',
  },
  {
    cadence: 'Tue – Thu',
    title: 'Build and test',
    body: 'Generate lots of ideas. Stress-test your assumptions with the cohort and real people. Call experts.',
  },
  {
    cadence: 'Friday',
    title: 'Pitch',
    body: (
      <>
        Pitch your program to us. Strong pitches get $5k on the spot, up to $45k more after two weeks of progress. We&apos;ll back the strongest programs to keep running with more funding and <A href="/programs/career-transition-grant">career transition grants</A>.
      </>
    ),
  },
];

const TheWeekSection = () => {
  return (
    <section className="section section-body fieldbuilder-week-schedule-section">
      <div className="w-full flex flex-col gap-6">
        <H3 className="max-w-[720px] text-balance">
          Incubator Week helps people found orgs. Fieldbuilder Week helps people found programs.
        </H3>

        <ul className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {SCHEDULE.map((item) => (
            <li
              key={item.title}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-40 bd-md:shrink-0">
                <span className="inline-flex items-center rounded-full bg-bluedot-navy/[0.06] px-3 py-1 text-size-xxs font-semibold uppercase tracking-[0.12em] text-bluedot-navy/70">
                  {item.cadence}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <H4>
                  {item.title}
                </H4>
                <P className="text-bluedot-navy/80">
                  {item.body}
                </P>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default TheWeekSection;
