import {
  A, H3, H4, P,
} from '@bluedot/ui';

const WhoItIsForSection = () => {
  return (
    <section className="section section-body context-week-who-section">
      <div className="w-full flex flex-col gap-8">
        <div className="max-w-prose flex flex-col gap-6">
          <H3>Participants</H3>
          <P>
            The experiment was designed for people with a strong record of study or work who
            were seriously considering contributing to AI safety: applying for a job or training
            programme, choosing a research area, developing a project, or moving into AI safety
            from another field.
          </P>
          <P>
            Applicants could still be considering several options. We looked for people who
            could explain what they wanted to understand about AI safety and how it could affect
            their work, discuss disagreements, acknowledge uncertainty, and change their minds.
            Relevant experience in other fields was welcome.
          </P>
        </div>

        <div className="max-w-prose rounded-xl border border-bluedot-navy/10 bg-bluedot-lighter/20 p-6 bd-md:p-8 flex flex-col gap-3">
          <H4>Context Week and Incubator Week</H4>
          <P className="text-bluedot-navy/80">
            Context Week was designed for people still working out which part of AI safety to
            focus on and where their skills would be useful, including those choosing between
            problems, roles, organisations, or project ideas who needed a firmer view of the field.
          </P>
          <P className="text-bluedot-navy/80">
            <A href="/programs/incubator-week">Incubator Week</A> is for people who have
            already chosen a specific intervention and know who it is meant to help. The
            programme gives them time to test an important assumption about that intervention.
          </P>
        </div>
      </div>
    </section>
  );
};

export default WhoItIsForSection;
