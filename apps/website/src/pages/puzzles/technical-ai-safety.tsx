import Head from 'next/head';
import {
  CTALinkOrButton, H1, H3, P, useLatestUtmParams,
} from '@bluedot/ui';
import { Nav } from '../../components/Nav/Nav';
import { COURSE_COLORS } from '../../lib/courseColors';
import { buildApplicationUrl } from '../../lib/utils';

const SITE_URL = 'https://bluedot.org';
const PAGE_PATH = '/puzzles/technical-ai-safety';
const PAGE_TITLE = 'Technical AI Safety Puzzle #1';
const PAGE_DEADLINE = '12th June';
const PAGE_HOOK = 'Most neural networks represent features linearly in their activations. Ours doesn’t.';
const PAGE_SUBTITLE = '$2500+ in prizes. Most neural networks represent features linearly in their activations. Ours doesn’t. Can you interpret it?';

const PUZZLE_REPO_URL = 'https://github.com/SamDower/bluedot-tais-puzzle';
const SUBMISSION_FORM_BASE_URL = 'https://web.miniextensions.com/KFslK1ZkgWb1AI4FwEMq';
const COURSE_URL = '/courses/technical-ai-safety';
const PUZZLE_IMAGE_SRC = '/images/puzzles/technical-ai-safety/puzzle.webp';
const OG_IMAGE_URL = `${SITE_URL}/images/puzzles/technical-ai-safety/og.png`;

const TAS = COURSE_COLORS['technical-ai-safety'];

const SECTION_HEADING_CLASS = 'text-size-xl font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy text-center';
const SECTION_PADDING_CLASS = 'max-w-max-width mx-auto px-5 py-8 bd-md:px-8 bd-md:py-10 lg:px-spacing-x lg:py-12';
const NARROW_COLUMN_CLASS = 'w-full max-w-text-narrow mx-auto';
const HEADING_TO_BODY_GAP_CLASS = 'mt-8 md:mt-10';

const TASKS = [
  {
    n: '1',
    title: 'Find F.',
    body: 'Identify which of the eight features is not represented linearly.',
  },
  {
    n: '2',
    title: 'Explain how F is represented.',
    body: 'Describe the geometric structure the model uses to represent F at layer L. Show the analysis you used to convince yourself.',
  },
  {
    n: '3',
    title: 'Train a model with an even weirder representation of F.',
    body: 'Train your own model that encodes F (or some other feature) in a more interesting way than ours. “More interesting” is up to you to define and defend.',
  },
] as const;

const PRIZES = [
  { place: '1st place', amount: '$1,000' },
  { place: '2nd place', amount: '$750' },
  { place: '3rd place', amount: '$500' },
  { place: 'Honourable mentions', amount: '$250 each' },
] as const;

const RULES = [
  `Please do not share answers publicly online until after ${PAGE_DEADLINE}.`,
  'Use of LLMs for understanding the puzzle and for coding is encouraged, but please write your submission in your own words. We will be checking!',
] as const;

const JUDGING_CRITERIA = [
  'Clarity of your explanations',
  'Strength of the evidence you generate for your answers',
  'Novelty in the model you train',
] as const;

const PuzzleTechnicalAiSafetyPage = () => {
  const { latestUtmParams } = useLatestUtmParams();
  const submissionFormUrl = buildApplicationUrl(SUBMISSION_FORM_BASE_URL, latestUtmParams.utm_source);

  return (
    <>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta name="description" content={PAGE_HOOK} />
        <link rel="canonical" href={`${SITE_URL}${PAGE_PATH}`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_HOOK} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content={`${SITE_URL}${PAGE_PATH}`} />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={PAGE_TITLE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_HOOK} />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
      </Head>

      <div className="relative bg-white">
        <Nav variant="transparent" />

        {/* Hero */}
        <section
          className="relative w-full overflow-hidden"
          style={{ background: TAS.gradient }}
        >
          <div
            className="absolute inset-0 pointer-events-none bg-contain bg-repeat mix-blend-soft-light opacity-60"
            style={{ backgroundImage: 'url(\'/images/agi-strategy/noise.webp\')' }}
          />
          <div className="relative max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x pt-[calc(var(--nav-height-mobile)+48px)] pb-16 bd-md:pt-[calc(var(--nav-height-mobile)+64px)] lg:pt-[calc(var(--nav-height-desktop)+96px)] lg:pb-24">
            <div className="max-w-3xl space-y-5 sm:space-y-6">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-size-xs font-medium uppercase tracking-[0.18em]"
                style={{ borderColor: TAS.accent, color: TAS.accent }}
              >
                Deadline: {PAGE_DEADLINE}
              </span>
              <H1 className="text-size-xl leading-tight font-semibold tracking-[-0.5px] text-white">
                {PAGE_TITLE}
              </H1>
              <P className="text-size-md leading-relaxed text-white/85">
                {PAGE_SUBTITLE}
              </P>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <CTALinkOrButton
                  url={PUZZLE_REPO_URL}
                  size="small"
                  className="h-10 lg:h-button-lg px-5 py-2.5 text-size-xs lg:text-size-sm font-medium rounded-md text-bluedot-navy hover:brightness-90"
                  style={{ backgroundColor: TAS.accent }}
                >
                  See the puzzle
                </CTALinkOrButton>
                <CTALinkOrButton
                  url={submissionFormUrl}
                  size="small"
                  className="h-10 lg:h-button-lg px-5 py-2.5 text-size-xs lg:text-size-sm font-medium rounded-md bg-transparent border hover:bg-white/10"
                  style={{ borderColor: TAS.accent, color: TAS.accent }}
                >
                  Submit your solution
                </CTALinkOrButton>
              </div>
            </div>
          </div>
        </section>

        {/* The puzzle */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className={NARROW_COLUMN_CLASS}>
              <h2 className={SECTION_HEADING_CLASS}>The puzzle</h2>
              <P className={`${HEADING_TO_BODY_GAP_CLASS} text-size-md leading-relaxed text-center text-bluedot-navy`}>
                We trained a model on short text inputs to predict eight binary features simultaneously (e.g. contains a person&rsquo;s name, mentions a food, phrased as a question). After a particular layer of this model, seven of these features are represented linearly, where a single direction in the activation space describes that feature. However, one feature F is represented in a different way. Your job is to figure out which feature it is and how it is represented.
              </P>
              <img
                src={PUZZLE_IMAGE_SRC}
                alt="Visualisation of the puzzle"
                className="mt-12 md:mt-16 w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Three tasks */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <h2 className={SECTION_HEADING_CLASS}>Your three tasks</h2>
            <div className={`${HEADING_TO_BODY_GAP_CLASS} grid grid-cols-1 lg:grid-cols-3 gap-4`}>
              {TASKS.map((task) => (
                <div
                  key={task.n}
                  className="bg-white border border-color-divider rounded-lg p-5 lg:p-6 flex flex-col gap-3"
                >
                  <span
                    className="text-size-xl font-semibold leading-none"
                    style={{ color: TAS.full }}
                  >
                    {task.n}
                  </span>
                  <H3 className="text-size-md font-semibold text-bluedot-navy">{task.title}</H3>
                  <P className="text-size-sm text-bluedot-navy/80 leading-relaxed">{task.body}</P>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you'll submit */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className={NARROW_COLUMN_CLASS}>
              <h2 className={SECTION_HEADING_CLASS}>What you&rsquo;ll submit</h2>
              <P className={`${HEADING_TO_BODY_GAP_CLASS} text-size-md text-bluedot-navy/80 leading-relaxed text-center`}>
                A single google doc, max 15 pages including figures, documenting what you tried, what worked, what didn&rsquo;t, and what structure emerged in the trained model. Images encouraged.
              </P>
              <p className="mt-8 text-center text-size-xs font-medium uppercase tracking-[0.18em] text-bluedot-navy/60">
                You&rsquo;ll be judged on
              </p>
              <ul className="mt-4 mx-auto max-w-md space-y-3">
                {JUDGING_CRITERIA.map((criterion) => (
                  <li key={criterion} className="flex items-start gap-3 text-size-md text-bluedot-navy/80 leading-relaxed">
                    <span
                      className="mt-2 size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: TAS.full }}
                    />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <div className={NARROW_COLUMN_CLASS}>
              <h2 className={SECTION_HEADING_CLASS}>What you get</h2>
              <p className={`${HEADING_TO_BODY_GAP_CLASS} text-center text-size-xs font-medium uppercase tracking-[0.18em] text-bluedot-navy/60`}>
                Prizes for best submissions
              </p>
              <ul className="mt-4 mx-auto max-w-sm divide-y divide-color-divider border-y border-color-divider bg-white rounded-lg overflow-hidden">
                {PRIZES.map((p) => (
                  <li key={p.place} className="flex items-baseline justify-between px-5 py-4 lg:px-6">
                    <span className="text-size-md font-medium text-bluedot-navy">{p.place}</span>
                    <span
                      className="text-size-md font-semibold"
                      style={{ color: TAS.full }}
                    >
                      {p.amount}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-size-sm text-bluedot-navy/70 leading-relaxed">
                We will also give shout outs on all of our socials to the best projects.
              </p>
              <div
                className="mt-6 rounded-lg p-5 lg:p-6"
                style={{ backgroundColor: TAS.bright }}
              >
                <P className="text-size-md leading-relaxed text-bluedot-navy text-center">
                  All submissions that answer parts 1 and 2 correctly will be considered for our
                  {' '}
                  <a href={COURSE_URL} className="font-semibold underline underline-offset-2 hover:text-bluedot-normal">Technical AI Safety course</a>
                  {' '}
                  (featuring rapid grant and career transition grant opportunities).
                </P>
              </div>
            </div>
          </div>
        </section>

        {/* Rules */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className={NARROW_COLUMN_CLASS}>
              <h2 className={SECTION_HEADING_CLASS}>Rules</h2>
              <ul className={`${HEADING_TO_BODY_GAP_CLASS} space-y-3`}>
                {RULES.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-size-md text-bluedot-navy/80 leading-relaxed">
                    <span
                      className="mt-2 size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: TAS.full }}
                    />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CTALinkOrButton
                url={PUZZLE_REPO_URL}
                size="small"
                className="h-10 lg:h-button-lg px-5 py-2.5 text-size-xs lg:text-size-sm font-medium rounded-md text-white hover:brightness-110"
                style={{ backgroundColor: TAS.full }}
              >
                See the puzzle
              </CTALinkOrButton>
              <CTALinkOrButton
                url={submissionFormUrl}
                size="small"
                className="h-10 lg:h-button-lg px-5 py-2.5 text-size-xs lg:text-size-sm font-medium rounded-md bg-transparent border hover:bg-bluedot-navy/5"
                style={{ borderColor: TAS.full, color: TAS.full }}
              >
                Submit your solution
              </CTALinkOrButton>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

PuzzleTechnicalAiSafetyPage.pageRendersOwnNav = true;

export default PuzzleTechnicalAiSafetyPage;
