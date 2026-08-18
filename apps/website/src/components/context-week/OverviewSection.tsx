import { H3, P } from '@bluedot/ui';

const OverviewSection = () => {
  return (
    <section className="section section-body context-week-overview-section">
      <div className="w-full max-w-prose flex flex-col gap-6">
        <H3>What Context Week is</H3>
        <P>
          Context Week is a four-day residential pilot for people deciding which AI-safety
          problem, intervention, role, or organisation to commit to.
        </P>
        <P>
          It is for people with strong ability and motivation whose decision is being held
          back by an incomplete map of the field, an underdeveloped theory of change, or
          uncertainty about their comparative advantage.
        </P>
        <P>
          The pilot tests whether structured study, adversarial discussion, scenario analysis,
          peer red-teaming, and individual coaching can help participants reach a specific,
          testable decision and make a better plan for the following 90 days.
        </P>
        <P className="text-bluedot-navy/80">
          Participants arrive on August 30. Programming runs from August 31 to September 3,
          and participants depart on September 4. Before the week, participants complete
          about three hours of preparation: a short document about their live decision and
          one reading selected by the programme team.
        </P>
      </div>
    </section>
  );
};

export default OverviewSection;
