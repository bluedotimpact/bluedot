import { pageSectionHeadingClass } from '../PageListRow';

type Persona = {
  title: string;
  description: string;
};

const PERSONAS: Persona[] = [
  {
    title: 'BlueDot graduate',
    description: 'You know the landscape, and you\'ve laid out your options through your action plan and 1-pager. The hard part now is committing to one direction and making real progress.',
  },
  {
    title: 'Pivoting your career',
    description: 'You\'re making big moves to contribute your personal and professional experience to AI safety. You\'ve left your current job (or are planning to), gone on sabbatical or are applying to roles or programs. You need help figuring out what the transition looks like for someone with your background.',
  },
  {
    title: 'Finding your fit',
    description: 'You\'ve completed fellowships, run reading groups and published your thinking on AI safety. You\'re looking for where you can make an impactful contribution given your background, and how you can get there.',
  },
];

const WhoYouAreSection = () => {
  return (
    <section className="section section-body advising-who-you-are-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Who we can help</h3>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {PERSONAS.map(({ title, description }) => (
            <li
              key={title}
              className="text-bluedot-navy/80 leading-[1.6]"
            >
              <strong className="text-bluedot-navy">
                {title}
              </strong>
              {`: ${description}`}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhoYouAreSection;
