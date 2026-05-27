import { A, P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

type Reading = {
  title: string;
  description: string;
  url: string;
};

const READINGS: Reading[] = [
  {
    title: 'Your goal isn\'t really to get a job',
    description: 'Advice from Matt Beard, an 80K advisor, to "get good, be known".',
    url: 'https://thatvastvariety.substack.com/p/your-goal-isnt-really-to-get-a-job',
  },
  {
    title: 'How to get into AI safety in 3 months',
    description: 'Another piece by Matt Beard with concrete advice and examples.',
    url: 'https://80000hours.substack.com/p/how-to-get-into-ai-safety-in-3-months',
  },
  {
    title: 'We asked 10+ AI safety orgs about their hiring needs',
    description: 'What they need most are people who can hit the ground running.',
    url: 'https://blog.bluedot.org/p/we-asked-ai-safety-orgs-about-their-hiring-needs',
  },
  {
    title: 'Roadmap through AI safety programs for early career technical researchers',
    description: 'Provides an opinionated take for which programs to aim for.',
    url: 'https://www.lesswrong.com/posts/muH6H9i8CtNAubcoo/roadmap-through-ai-safety-programs-for-early-career',
  },
  {
    title: 'I\'m an experienced software engineer. How can I contribute to AI safety\?',
    description: 'Maps out concrete contributions you can make.',
    url: 'https://blog.bluedot.org/p/im-an-experienced-swe',
  },
];

const RecommendedReadingSection = () => {
  return (
    <section className="section section-body advising-recommended-reading-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What our best advisees have in common</h3>

        <P>
          They read these before applying and acted on the advice. The call then builds on what they&apos;ve already tried.
        </P>

        <ul className="list-disc pl-6 flex flex-col gap-2">
          {READINGS.map(({ title, description, url }) => (
            <li key={url} className="text-bluedot-navy/80 leading-[1.6]">
              <A
                href={url}
                target="_blank"
                className="font-semibold"
              >
                {title}
              </A>
              {`. ${description}`}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default RecommendedReadingSection;
