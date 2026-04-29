import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const SUBMISSION_PROMPTS = [
  {
    title: 'Your plans for the grant period',
    body: 'A rough plan for how you would spend your time. Think about this as an active process: talking to people in the field, testing ideas, trying short projects, applying to roles or fellowships. Not six months alone with a laptop.',
  },
  {
    title: 'How much you would need and for how long',
    body: 'Propose a budget and duration that would let you fully commit, including any other resources you might need to support your transition.',
  },
  {
    title: 'How you are thinking about your path into AI safety',
    body: 'You have skills and experiences that are valuable. Lean into them. What is your instinct for where you could contribute? What are you most uncertain about, and how would you use the grant period to resolve those uncertainties?',
  },
  {
    title: 'Why you',
    body: 'A few concrete things you have already done that show you will make good use of this grant (e.g. past projects, relevant experience).',
  },
  {
    title: 'Your current situation',
    body: 'What are you doing now, and what is your timeline for going full-time?',
  },
];

const SubmissionPromptsSection = () => {
  return (
    <section className="section section-body career-transition-grant-prompts-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What to submit</h3>

        <P>Put together a 1-2 page proposal covering the prompts below.</P>

        <div className="pt-2 grid gap-4 bd-md:gap-5 grid-cols-1 bd-md:grid-cols-2 lg:grid-cols-3">
          {SUBMISSION_PROMPTS.map((item, index) => (
            <div
              key={item.title}
              className="relative rounded-lg border border-bluedot-navy/10 bg-white px-6 py-6 flex flex-col gap-4"
            >
              <p className="text-size-xxs font-semibold uppercase tracking-[0.14em] text-bluedot-navy/40">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h4 className="text-size-md bd-md:text-[20px] font-semibold leading-tight text-bluedot-navy">
                {item.title}
              </h4>
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/75">
                {item.body}
              </P>
            </div>
          ))}
          <div className="relative rounded-lg border border-bluedot-lighter bg-bluedot-lighter/20 px-6 py-6 flex flex-col gap-4">
            <p className="text-size-xxs font-semibold uppercase tracking-[0.14em] text-bluedot-dark">
              Tips
            </p>
            <div className="flex flex-col gap-4">
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/80">
                <strong className="text-bluedot-navy">Be honest about your uncertainties.</strong>
                {' '}We do not expect you to have it all figured out. Provide an honest account of your uncertainties and plan for working through them.
              </P>
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/80">
                <strong className="text-bluedot-navy">Keep it concise.</strong>
                {' '}Clear writing is a sign of clear thinking.
              </P>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubmissionPromptsSection;
