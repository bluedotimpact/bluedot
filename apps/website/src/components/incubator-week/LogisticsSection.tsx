import { H3, P } from '@bluedot/ui';

const LOGISTICS = [
  {
    label: 'Location',
    body: 'In-person in San Francisco. We\'ll fly you in and cover all expenses.',
  },
  {
    label: 'Focus areas',
    body: 'Founders building nonprofit and for-profit startups in fields like AI safety, biosecurity, cybersecurity, and other catastrophic risk reduction.',
  },
  {
    label: 'Schedule',
    body: 'August 17–21.',
  },
];

const LogisticsSection = () => {
  return (
    <section className="section section-body incubator-week-logistics-section">
      <div className="w-full flex flex-col gap-6">
        <H3>Logistics</H3>

        <ul className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {LOGISTICS.map((item) => (
            <li
              key={item.label}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-40 bd-md:shrink-0">
                <span className="inline-flex items-center rounded-full bg-bluedot-navy/[0.06] px-3 py-1 text-size-xxs font-semibold uppercase tracking-[0.12em] text-bluedot-navy/70">
                  {item.label}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <P className="text-size-sm leading-relaxed text-bluedot-navy/80">
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

export default LogisticsSection;
