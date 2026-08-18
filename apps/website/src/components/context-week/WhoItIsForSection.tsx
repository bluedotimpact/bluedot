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
            We are looking for people with a strong record of study or work who are seriously
            considering contributing to AI safety. They may be applying for a job or training
            programme, choosing a research area, developing a project, or moving into AI safety
            from another field.
          </P>
          <P>
            Applicants may still be considering several options. They should be able to explain
            what they want to understand about AI safety and how it could affect work they are
            considering. We also expect them to discuss disagreements, say when they are
            uncertain, and change their mind. Relevant experience in other fields is useful.
          </P>
        </div>

        <div className="max-w-prose rounded-xl border border-bluedot-navy/10 bg-bluedot-lighter/20 p-6 bd-md:p-8 flex flex-col gap-3">
          <H4>Context Week and Incubator Week</H4>
          <P className="text-bluedot-navy/80">
            Context Week is for people who are still working out which part of AI safety to
            focus on and where their skills would be useful. They may be choosing between
            problems, roles, organisations, or project ideas. Some mainly need a firmer view
            of the field before making that choice.
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
