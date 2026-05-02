import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const TrackRecordSection = () => {
  return (
    <section className="section section-body incubator-week-track-record-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Track record</h3>

        <div className="flex flex-col gap-5">
          <P>
            Three cohorts in: 23 participants, 11 companies founded, 7 still going, $500k+ raised.
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
                : quit AISI; raised from Manifund for an automated evals lab (stealth)
              </li>
              <li>
                <a href="https://www.linkedin.com/in/shay-yahal/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Shay Yahal</a>
                : enterprise AI security (stealth); paying customers, Redwood Research partnership
              </li>
              <li>
                <a href="https://www.linkedin.com/in/z-saber/" target="_blank" rel="noreferrer" className="underline hover:no-underline">Zac Saber</a>
                : dropped out of EF; building long-horizon evals (stealth)
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
