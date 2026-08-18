import { H3, H4, P } from '@bluedot/ui';

const CORE_OUTPUTS = [
  {
    title: 'A revised decision memo',
    body: 'A comparison of the live options, the causal reasoning behind the preferred option, the main uncertainties, and the evidence that would change the decision.',
  },
  {
    title: 'A 30-day action',
    body: 'A practical test or evidence-gathering action chosen to reduce uncertainty about the decision.',
  },
  {
    title: 'A 90-day plan',
    body: 'A specific and reversible plan with indicators of progress and failure.',
  },
];

const ParticipantOutputsSection = () => {
  return (
    <section className="section section-body context-week-outputs-section">
      <div className="w-full flex flex-col gap-8">
        <div className="max-w-prose flex flex-col gap-4">
          <H3>What participants leave with</H3>
          <P>
            Each participant finishes the week with a decision that has been challenged and
            a concrete way to test it.
          </P>
        </div>

        <div className="grid grid-cols-1 gap-5 bd-md:grid-cols-3">
          {CORE_OUTPUTS.map((output) => (
            <div
              key={output.title}
              className="rounded-xl border border-bluedot-navy/10 bg-white p-6 flex flex-col gap-2"
            >
              <H4>{output.title}</H4>
              <P className="text-bluedot-navy/80">{output.body}</P>
            </div>
          ))}
        </div>

        <div className="max-w-prose flex flex-col gap-4">
          <P>
            Participants also complete a before-and-after field map, a comparison of two
            competing theories of change, and a belief-change log.
          </P>
          <P className="text-bluedot-navy/80">
            Because this is a pilot, BlueDot will assess the decisions at intake and at the
            end of the week, then follow up after 90 days. We will also monitor possible
            negative effects, including overconfidence and pressure to conform.
          </P>
        </div>
      </div>
    </section>
  );
};

export default ParticipantOutputsSection;
