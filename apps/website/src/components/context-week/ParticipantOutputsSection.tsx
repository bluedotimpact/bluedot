import { H3, P } from '@bluedot/ui';

const ParticipantOutputsSection = () => {
  return (
    <section className="section section-body context-week-outputs-section">
      <div className="w-full max-w-prose flex flex-col gap-4">
        <H3>After Context Week</H3>
        <P>
          The programme aimed to help participants explain the main concerns about AI risk,
          the work being done in response, and why people support different approaches.
          It was also designed to help them consider which roles or projects suited their
          skills and explain their interests and reasoning in applications or interviews.
        </P>
        <P className="text-bluedot-navy/80">
          The intended output was a record of each participant&apos;s next steps, such as
          applications, conversations, further reading, or project work, and what they still
          needed to learn before making a decision.
        </P>
        <P className="text-bluedot-navy/80">
          The evaluation plan included assessing participants&apos; knowledge before and after
          the programme and contacting them 90 days later to ask what they did next. It also
          included looking for overconfidence and pressure to agree with the group.
        </P>
      </div>
    </section>
  );
};

export default ParticipantOutputsSection;
