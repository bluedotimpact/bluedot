import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const LOGISTICS = [
  {
    label: 'Location',
    body: 'In-person in London, working from LISA alongside Apollo Research and other leading organizations. We\'ll fly you in and cover all expenses.',
  },
  {
    label: 'Focus areas',
    body: 'AI safety, biosecurity, cybersecurity, and other catastrophic risk reduction. For now we\'re focused on for-profit companies.',
  },
  {
    label: 'Schedule',
    body: '1-5 June.',
  },
];

const LogisticsSection = () => {
  return (
    <section className="section section-body incubator-week-logistics-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Logistics</h3>

        <ul className="flex flex-col divide-y divide-bluedot-navy/10 border-y border-bluedot-navy/10">
          {LOGISTICS.map((item) => (
            <li
              key={item.label}
              className="flex flex-col bd-md:flex-row bd-md:items-baseline gap-3 bd-md:gap-10 py-6"
            >
              <div className="bd-md:w-[160px] bd-md:shrink-0">
                <span className="inline-flex items-center rounded-full bg-bluedot-navy/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-bluedot-navy/70">
                  {item.label}
                </span>
              </div>
              <div className="flex flex-col gap-2">
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

export default LogisticsSection;
