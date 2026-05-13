import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const SCHEDULE = [
  {
    cadence: 'Monday',
    title: 'Outcome and opportunities',
    body: 'Define the impact you\'re unlocking. Find the talent best placed to deliver it. Go talk to them.',
  },
  {
    cadence: 'Tue – Thu',
    title: 'Build and test',
    body: 'Generate lots of ideas. Stress-test your assumptions with the cohort. Build and test your program with real people. Call experts. Iterate until it sticks.',
  },
  {
    cadence: 'Friday',
    title: 'Pitch',
    body: 'Pitch to us. The conversations, the prototype, the signal. Where it goes from here. Strong pitches get $5k on the spot, up to $45k more after two weeks of progress, and a path to $200k total for the strongest programs.',
  },
];

const TheWeekSection = () => {
  return (
    <section className="section section-body builder-week-schedule-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>The week</h3>

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
                <h4 className="text-size-md font-semibold text-bluedot-navy">
                  {item.title}
                </h4>
                <P className="text-size-sm leading-[1.65] text-bluedot-navy/80">
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
