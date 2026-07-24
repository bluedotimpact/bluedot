import Head from 'next/head';
import { H1, P } from '@bluedot/ui';
import { Nav } from '../../../components/Nav/Nav';
import { COURSE_COLORS } from '../../../lib/courseColors';

const SITE_URL = 'https://bluedot.org';
const PAGE_PATH = '/puzzles/technical-ai-safety/submitted';
const PAGE_TITLE = 'Wait! We have more we want to give you.';
const PAGE_META_TITLE = 'Thanks for submitting | Technical AI Safety Puzzle #1';
const PAGE_DESCRIPTION = 'At BlueDot we support people like you to build careers in technical AI safety.';
const OG_IMAGE_URL = `${SITE_URL}/images/puzzles/technical-ai-safety/og.png`;

const TAS = COURSE_COLORS['technical-ai-safety'];

const SECTION_CONTAINER_CLASS = 'max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x';
const SECTION_PADDING_CLASS = `${SECTION_CONTAINER_CLASS} py-4 bd-md:py-5 lg:py-6`;
const EYEBROW_CLASS = 'text-size-xxs font-medium uppercase tracking-wide text-bluedot-navy/60';

const BOOKS_URL = 'https://impactbooks.store/collections/bluedot-impact-ai-safety';

const OFFERINGS = [
  {
    name: 'Technical AI Safety course',
    url: 'https://bluedot.org/courses/technical-ai-safety?utm_source=puzzle%20submission',
    description: 'To give you a map of the technical intervention landscape and learn where you could fit in.',
  },
  {
    name: 'Technical AI Safety project sprint',
    url: 'https://bluedot.org/courses/technical-ai-safety-project?utm_source=puzzle%20submission',
    description: 'Get your hands dirty and build portfolio pieces with expert mentorship to build your credibility and get hired.',
  },
  {
    name: '1-1 advising calls',
    url: 'https://bluedot.org/programs/advising?utm_source=puzzle%20submission',
    description: 'Get personal advice on how to transition into full time technical AI safety work.',
  },
  {
    name: 'Rapid grants',
    url: 'https://bluedot.org/programs/rapid-grants?utm_source=puzzle%20submission',
    description: 'Small grants up to $10k for compute and other expenses so you can do awesome projects.',
  },
  {
    name: 'Career transition grants',
    url: 'https://bluedot.org/programs/career-transition-grant?utm_source=puzzle%20submission',
    description: 'If you’re really good, we’ll even pay you a salary to quit your job and work full time on technical AI safety.',
  },
] as const;

const PuzzleSubmittedPage = () => (
  <>
    <Head>
      <title>{PAGE_META_TITLE}</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta name="robots" content="noindex" />
      <link rel="canonical" href={`${SITE_URL}${PAGE_PATH}`} />
      <meta property="og:title" content={PAGE_META_TITLE} />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BlueDot Impact" />
      <meta property="og:url" content={`${SITE_URL}${PAGE_PATH}`} />
      <meta property="og:image" content={OG_IMAGE_URL} />
    </Head>

    <div className="relative bg-white">
      <Nav variant="default" />

      {/* Title */}
      <section>
        <div className={`${SECTION_CONTAINER_CLASS} pt-[calc(var(--nav-height-mobile)+8px)] pb-2 bd-md:pt-[calc(var(--nav-height-mobile)+10px)] bd-md:pb-2 lg:pt-[calc(var(--nav-height-desktop)+10px)] lg:pb-3`}>
          <div className="max-w-text mx-auto text-center">
            <H1 className="text-size-xl">
              {PAGE_TITLE}
            </H1>
          </div>
        </div>
      </section>

      {/* Intro paragraphs */}
      <section>
        <div className={SECTION_PADDING_CLASS}>
          <div className="max-w-text mx-auto space-y-4">
            <P className="text-size-md leading-relaxed">
              Congratulations on submitting your puzzle solution. If you made it this far you&rsquo;re clearly a technical person who likes solving puzzles and is interested in machine learning. At BlueDot we support people like yourself to build careers in technical AI safety. You would solve hard interesting technical problems AND have a positive impact on the world by reducing catastrophic risk from AI.
            </P>
            <P className="text-size-md leading-relaxed">
              Imagine that feature you were looking for was deception or hazardous biological weapon information in a next generation LLM. Identifying and understanding that representation could prevent a lot of harm, and this is still an open technical question. If you&rsquo;re still not sold that AI poses catastrophic risks, take a look at our
              {' '}
              <a
                href="https://bluedot.org/courses/future-of-ai?utm_source=puzzle%20submission"
                className="font-semibold underline underline-offset-2 hover:text-bluedot-normal"
              >
                Future of AI course
              </a>
              .
            </P>
          </div>
        </div>
      </section>

      {/* Free book */}
      <section>
        <div className={SECTION_PADDING_CLASS}>
          <div className="max-w-text mx-auto">
            <h2 className={EYEBROW_CLASS}>A free book</h2>
            <P className="mt-4 text-size-md leading-relaxed">
              Firstly, claim a
              {' '}
              <a
                href={BOOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2 hover:text-bluedot-normal"
              >
                free AI safety book
              </a>
              {' '}
              that will be delivered straight to you.
            </P>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-color-canvas">
        <div className={SECTION_PADDING_CLASS}>
          <div className="max-w-text mx-auto">
            <h2 className={EYEBROW_CLASS}>What we offer (all for free)</h2>
            <ul className="mt-4 space-y-4">
              {OFFERINGS.map((o) => (
                <li key={o.name} className="flex items-start gap-3">
                  <span
                    className="mt-2 size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: TAS.full }}
                  />
                  <div className="flex-1">
                    <a
                      href={o.url}
                      className="text-size-md font-semibold text-bluedot-navy underline underline-offset-2 hover:text-bluedot-normal"
                    >
                      {o.name}
                    </a>
                    <P className="mt-1 text-bluedot-navy/80">
                      {o.description}
                    </P>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  </>
);

PuzzleSubmittedPage.pageRendersOwnNav = true;

export default PuzzleSubmittedPage;
