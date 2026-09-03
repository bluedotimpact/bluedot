import { H3, P } from '@bluedot/ui';

const OverviewSection = () => {
  return (
    <section className="section section-body context-week-overview-section">
      <div className="w-full max-w-prose flex flex-col gap-6">
        <H3>About Context Week</H3>
        <P>
          Context Week brings together around 20 people who are considering work in AI safety.
          Participants study how the field developed, the risks people are concerned about,
          and the work being done in response. They also compare different theories of change
          and meet people working in several parts of the field.
        </P>
        <P>
          The programme includes seminars, 1:1 conversations, sessions with guests, and time
          with other participants. Sessions examine the evidence and assumptions behind
          different views. Participants can use this material when applying for roles or
          programmes and when choosing between jobs, training, or projects.
        </P>
        <P className="text-bluedot-navy/80">
          Participants arrive on August 30. Programming runs from August 31 to September 3,
          and participants depart on September 4.
        </P>
      </div>
    </section>
  );
};

export default OverviewSection;
