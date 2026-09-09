import { H3, P } from '@bluedot/ui';

const OverviewSection = () => {
  return (
    <section className="section section-body context-week-overview-section">
      <div className="w-full max-w-prose flex flex-col gap-6">
        <H3>What we did</H3>
        <P>
          We brought together 24 participants at Lighthaven in Berkeley for four programme
          days, from 31 August to 3 September 2026. The group included people exploring AI
          safety and people already working in the field.
        </P>
        <P>
          Participants read primary sources on AI capabilities and risks, discussed them in
          small groups, and took part in debates with assigned positions. They wrote about
          desirable futures, compared strategies for responding to advanced AI, and discussed
          organisations working on AI safety.
        </P>
        <P>
          The week also included career writing, feedback on participants&apos; plans, and
          one-to-one conversations with facilitators, practitioners and peers. Participants
          drafted career memos setting out their options, questions and possible next steps.
        </P>
      </div>
    </section>
  );
};

export default OverviewSection;
