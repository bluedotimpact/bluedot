import { H3, P } from '@bluedot/ui';

const TrackRecordSection = () => {
  return (
    <div className="incubator-week-track-record-section flex max-w-[60ch] flex-col gap-6">
      <H3>Track record</H3>

      <div className="flex flex-col gap-5">
        <P>
          Past cohorts: 50 participants, $10M+ in external funding raised.
        </P>
        <div className="flex flex-col gap-2">
          <P>Alumni have started organisations focused on:</P>
          <ul className="list-disc pl-6 flex flex-col gap-1">
            <li>Evaluating frontier AI cyber capabilities and building defences</li>
            <li>Detecting hallucinations using model internals</li>
            <li>Modelling AI risk for insurance</li>
          </ul>
          <P>And more.</P>
        </div>
        <P>
          Plus career transition grants and placements at AI safety organisations.
        </P>
      </div>
    </div>
  );
};

export default TrackRecordSection;
