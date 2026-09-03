import { H3, P } from '@bluedot/ui';

const ParticipantOutputsSection = () => {
  return (
    <section className="section section-body context-week-outputs-section">
      <div className="w-full max-w-prose flex flex-col gap-4">
        <H3>After Context Week</H3>
        <P>
          By the end of the programme, participants should be able to explain the main
          concerns about AI risk, the work being done in response, and why people support
          different approaches. They will have considered which roles or projects suit their
          skills and how to explain their interests and reasoning in applications or interviews.
        </P>
        <P className="text-bluedot-navy/80">
          Each person will record what they plan to do next. Their next steps may include
          applications, conversations, further reading, or project work. They may make a
          decision during the week or leave knowing what they still need to learn.
        </P>
      </div>
    </section>
  );
};

export default ParticipantOutputsSection;
