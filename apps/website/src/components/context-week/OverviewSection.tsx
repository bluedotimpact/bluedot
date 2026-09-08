import { H3, P } from '@bluedot/ui';

const OverviewSection = () => {
  return (
    <section className="section section-body context-week-overview-section">
      <div className="w-full max-w-prose flex flex-col gap-6">
        <H3>About Context Week</H3>
        <P>
          Context Week was a four-day residential experiment designed for around 20 people
          considering work in AI safety. It aimed to help participants understand how the
          field developed, the risks people are concerned about, and the work being done in
          response, compare different theories of change, and meet people working in the field.
        </P>
        <P>
          The programme was designed around seminars, 1:1 conversations, sessions with guests,
          and time with other participants. The aim was to examine the evidence and assumptions
          behind different views and help participants choose between jobs, training, or projects.
        </P>
        <P className="text-bluedot-navy/80">
          The experiment was scheduled for August 30 to September 4, 2026, with programming
          from August 31 to September 3. Preparation included about ten hours of reading
          selected by the programme team.
        </P>
      </div>
    </section>
  );
};

export default OverviewSection;
