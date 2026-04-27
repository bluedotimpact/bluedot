import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const SCHEDULE = [
  {
    cadence: 'Monday',
    title: 'Threat models',
    body: 'Develop threat models and identify the top experts in your problem space.',
  },
  {
    cadence: 'Tue – Wed',
    title: 'Build interventions',
    body: 'Build and iterate on interventions, call experts, attend our community social.',
  },
  {
    cadence: 'Thursday',
    title: 'Pitch prep',
    body: 'Sharpen the story and create your pitch.',
  },
  {
    cadence: 'Friday',
    title: 'Pitch for funding',
    body: 'Pitch to us for funding. Strong pitches receive initial grants of £50k+ to work on your project full-time.',
  },
];

const TheWeekSection = () => {
  return (
    <section className="section section-body incubator-week-schedule-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>The week</h3>

        <ul className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {SCHEDULE.map((item) => (
            <li
              key={item.title}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-[160px] bd-md:shrink-0">
                <span className="inline-flex items-center rounded-full bg-bluedot-navy/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-bluedot-navy/70">
                  {item.cadence}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-[18px] bd-md:text-[20px] font-semibold text-bluedot-navy">
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
