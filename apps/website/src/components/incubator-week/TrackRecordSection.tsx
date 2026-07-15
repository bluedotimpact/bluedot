import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const TrackRecordSection = () => {
  return (
    <section className="section section-body incubator-week-track-record-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Track record</h3>

        <div className="flex flex-col gap-5">
          <P>
            Past cohorts: 38 participants, $2.5M+ in external funding raised.
          </P>
          <div className="flex flex-col gap-2">
            <P>Alumni include:</P>
            <ul className="list-disc pl-6 flex flex-col gap-1">
              <li>
                <a href="https://www.exonalab.com/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Exona Lab</a>
                : quantifying AI risk for the Lloyd&apos;s insurance market; Lloyd&apos;s Lab Cohort 16, paper with Bengio, Reuters feature
              </li>
              <li>
                <a href="https://www.0labs.ai/" target="_blank" rel="noreferrer" className="underline hover:no-underline">0Labs</a>
                : AI purple teaming — adversarial agents that expose detection gaps before attackers do
              </li>
              <li>
                <a href="https://www.telluvian.ai/about.html" target="_blank" rel="noreferrer" className="underline hover:no-underline">Telluvian</a>
                : mechanistic interpretability for high-stakes AI; FR8 incubator
              </li>
              <li>
                <a href="https://www.linkedin.com/in/jacob-arbeid/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Jacob Arbeid</a>
                : quit AISI; raised from ACX/Manifund to build an automated cyber evals lab (stealth)
              </li>
              <li>
                <a href="https://www.linkedin.com/in/shay-yahal/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Shay Yahal</a>
                : enterprise AI safety (stealth); paying customers, Redwood Research partnership
              </li>
              <li>
                <a href="https://www.linkedin.com/in/cecilia-elena-tilli-8a6890a4/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Cecilia Tilli</a>
                : raised $480k from Coefficient Giving after pitching on the Friday of Incubator Week; building an organisation working on desirable propensities and character traits for safe deployment in multi-agent settings
              </li>
              <li>
                <a href="https://www.linkedin.com/in/alexcsaky/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Alex Csaky</a>
                : offered an Entrepreneur in Residence role at Forethought after Incubator Week; now growing the field around AI for epistemics and coordination technology
              </li>
              <li>
                <a href="https://safely.bio/" target="_blank" rel="noreferrer" className="underline hover:no-underline">safely.bio</a>
                : runs know-your-customer checks on researchers placing synthetic DNA orders, records the evidence, and returns a clear recommendation so labs can distinguish legitimate researchers from bad actors before shipping
              </li>
            </ul>
          </div>
          <P>
            Plus career transition grants and placements at Andon Labs, ASET, and BlueDot.
          </P>
        </div>
      </div>
    </section>
  );
};

export default TrackRecordSection;
