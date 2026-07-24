import { H3, H4, P } from '@bluedot/ui';

const SCHEDULE = [
  {
    cadence: 'Monday',
    title: 'Threat models',
    body: 'Develop threat models and identify the top experts in your problem space.',
  },
  {
    cadence: 'Tue – Wed',
    title: 'Build interventions',
    body: 'Build and test interventions, call experts, and pressure-test your assumptions with the cohort.',
  },
  {
    cadence: 'Thursday',
    title: 'Pitch prep',
    body: 'Sharpen the story and create your pitch.',
  },
  {
    cadence: 'Friday',
    title: 'Pitch for funding',
    body: 'Pitch to us. If we back your pitch, we will fund your immediate needs on the spot and—if you make good progress—give you up to $100k in grant funding within two weeks.',
  },
];

const TheWeekSection = () => {
  return (
    <section className="section section-body incubator-week-schedule-section">
      <div className="w-full flex flex-col gap-6">
        <H3>The week</H3>

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
