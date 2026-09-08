import { H3, P } from '@bluedot/ui';

const FourDayProgrammeSection = () => {
  return (
    <section className="section section-body context-week-programme-section">
      <div className="w-full max-w-prose flex flex-col gap-4">
        <H3>Programme</H3>
        <P className="text-bluedot-navy/80">
          The programme was designed around facilitator-led seminars, generally in small
          groups, alongside 1:1 conversations and sessions with guests working in AI safety.
          Meals and evenings were intended to leave time for less structured conversations.
        </P>
        <P className="text-bluedot-navy/80">
          Planned sessions covered the history of
          AI safety, current risks and responses, disagreements between different approaches,
          the work of existing organisations, and how participants might use what they learn
          when choosing their next steps.
        </P>
      </div>
    </section>
  );
};

export default FourDayProgrammeSection;
