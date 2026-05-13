import Head from 'next/head';
import {
  CTALinkOrButton, H1, P, useLatestUtmParams,
} from '@bluedot/ui';
import { Nav } from '../../components/Nav/Nav';
import { COURSE_COLORS } from '../../lib/courseColors';
import { buildApplicationUrl } from '../../lib/utils';

const SITE_URL = 'https://bluedot.org';
const PAGE_PATH = '/puzzles/technical-ai-safety';
const PAGE_TITLE = 'Technical AI Safety Puzzle #1';
const PAGE_DEADLINE = '12th June';
const PAGE_LEADERBOARD_AS_OF = '13th May';
const PAGE_HOOK = 'Most neural networks represent features linearly in their activations. Ours doesn’t.';
const PAGE_SUBTITLE = '$2500+ in prizes. Most neural networks represent features linearly in their activations. Ours doesn’t. Can you interpret it?';

const PUZZLE_URL = 'https://colab.research.google.com/github/SamDower/bluedot-tais-puzzle/blob/main/puzzle.ipynb';
const SUBMISSION_FORM_BASE_URL = 'https://web.miniextensions.com/KFslK1ZkgWb1AI4FwEMq';
const PUZZLE_IMAGE_SRC = '/images/puzzles/technical-ai-safety/puzzle.webp';
const OG_IMAGE_URL = `${SITE_URL}/images/puzzles/technical-ai-safety/og.png`;

const TAS = COURSE_COLORS['technical-ai-safety'];

const SECTION_CONTAINER_CLASS = 'max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x';
const SECTION_PADDING_CLASS = `${SECTION_CONTAINER_CLASS} py-6 bd-md:py-8 lg:py-10`;
const EYEBROW_CLASS = 'text-size-xs font-semibold uppercase tracking-[0.18em] text-bluedot-navy/60';

const TASKS = [
  {
    n: '1',
    title: 'Find it.',
    body: 'Identify which of the eight features is not represented linearly.',
  },
  {
    n: '2',
    title: 'Explain how it is represented.',
    body: 'Describe the geometric structure the model uses to represent it at layer L. Show the analysis you used to convince yourself.',
  },
  {
    n: '3',
    title: 'Train a model with an even weirder representation.',
    body: 'Train your own model that encodes it (or some other feature) in a more interesting way than ours. “More interesting” is up to you to define and defend.',
  },
] as const;

const PRIZES = [
  { place: '1st', amount: '$1,000' },
  { place: '2nd', amount: '$750' },
  { place: '3rd', amount: '$500' },
  { place: 'Honourable mentions', amount: '$250 each' },
] as const;

const RULES = [
  `Please do not share answers publicly online until after ${PAGE_DEADLINE}.`,
  'Use of LLMs for understanding the puzzle and for coding is encouraged.',
  'Please write your submission in your own words. We will be checking!',
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
        <Nav variant="default" />

        {/* Title section — clean, no banner */}
        <section>
          <div className={`${SECTION_CONTAINER_CLASS} pt-[calc(var(--nav-height-mobile)+8px)] pb-2 bd-md:pt-[calc(var(--nav-height-mobile)+10px)] bd-md:pb-2 lg:pt-[calc(var(--nav-height-desktop)+10px)] lg:pb-3`}>
            <div className="max-w-text mx-auto text-center space-y-3">
              <H1 className="text-size-xl leading-tight font-semibold tracking-[-0.4px] text-bluedot-navy">
                {PAGE_TITLE}
              </H1>
              <P className="text-size-md leading-relaxed text-bluedot-navy/70">
                {PAGE_SUBTITLE}
              </P>
            </div>
          </div>
        </section>

        {/* Puzzle image — visual opener */}
        <section>
          <div className={`${SECTION_CONTAINER_CLASS} pt-2 bd-md:pt-3 lg:pt-4`}>
            <img
              src={PUZZLE_IMAGE_SRC}
              alt="Visualisation of the puzzle"
              className="block w-full max-w-text mx-auto h-auto rounded-lg"
            />
          </div>
        </section>

        {/* The puzzle description */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>The puzzle</h2>
              <P className="mt-4 text-size-md leading-relaxed text-bluedot-navy">
                We trained a model on short text inputs to predict eight binary features simultaneously (e.g. contains a person&rsquo;s name, mentions a food, phrased as a question). After a particular layer of this model, seven of these features are represented linearly, where a single direction in the activation space describes that feature. However, one feature is represented in a different way.
              </P>
              <P className="mt-4 text-size-md leading-relaxed text-bluedot-navy">
                Your job is to figure out which feature it is and how it is represented.
              </P>
            </div>
          </div>
        </section>

        {/* Your three tasks — inline numbered list */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>Your three tasks</h2>
              <ol className="mt-4 space-y-3">
                {TASKS.map((task) => (
                  <li key={task.n} className="flex gap-3 text-size-sm text-bluedot-navy/80 leading-relaxed">
                    <span
                      className="font-semibold shrink-0 tabular-nums"
                      style={{ color: TAS.full }}
                    >
                      {task.n}.
                    </span>
                    <span>
                      <span className="font-semibold text-bluedot-navy">{task.title}</span>
                      {' '}
                      {task.body}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Correct submissions */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>Correct submissions as of {PAGE_LEADERBOARD_AS_OF}</h2>
              <div className="mt-4 rounded-lg border border-color-divider p-6 lg:p-8 text-center">
                <p className="text-size-sm text-bluedot-navy/70 leading-relaxed">
                  No correct submissions yet. Be the first.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>What you get</h2>
              <div className="mt-5 grid grid-cols-2 bd-md:grid-cols-4 gap-4 text-center">
                {PRIZES.map((p) => (
                  <div key={p.place}>
                    <p
                      className="text-size-lg font-semibold tabular-nums leading-none"
                      style={{ color: TAS.full }}
                    >
                      {p.amount}
                    </p>
                    <p className="mt-2 text-size-xs font-semibold uppercase tracking-[0.18em] text-bluedot-navy/60">
                      {p.place}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-size-sm text-bluedot-navy/80 leading-relaxed">
                Any submissions which impress us will also receive shout outs on all our socials and we&rsquo;ll keep an eye out for strong candidates for our courses, programs, and grants.
              </p>
            </div>
          </div>
        </section>

        {/* What you'll submit */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>What you&rsquo;ll submit</h2>
              <P className="mt-4 text-size-sm text-bluedot-navy/80 leading-relaxed">
                A single google doc, documenting what you tried, what worked, what didn&rsquo;t, and what structure emerged in the trained model. Images encouraged. You will be judged on:
              </P>
              <ul className="mt-3 space-y-2">
                {JUDGING_CRITERIA.map((criterion) => (
                  <li key={criterion} className="flex items-start gap-2 text-size-sm text-bluedot-navy/80 leading-relaxed">
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

        {/* Rules */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>Rules</h2>
              <ul className="mt-4 space-y-2">
                {RULES.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-size-sm text-bluedot-navy/80 leading-relaxed">
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

        {/* Closing CTA — deadline + buttons, restrained */}
        <section>
          <div className={`${SECTION_CONTAINER_CLASS} py-10 bd-md:py-12 lg:py-14`}>
            <div className="max-w-text mx-auto text-center space-y-5">
              <p
                className="text-size-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: TAS.full }}
              >
                Deadline: {PAGE_DEADLINE}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <CTALinkOrButton
                  url={PUZZLE_URL}
                  size="small"
                  className="h-11 lg:h-12 px-6 lg:px-7 text-size-sm font-semibold rounded-md text-white hover:brightness-110"
                  style={{ backgroundColor: TAS.full }}
                >
                  See the puzzle
                </CTALinkOrButton>
                <CTALinkOrButton
                  url={submissionFormUrl}
                  size="small"
                  className="h-11 lg:h-12 px-6 lg:px-7 text-size-sm font-semibold rounded-md bg-transparent border hover:bg-bluedot-navy/5"
                  style={{ borderColor: TAS.full, color: TAS.full }}
                >
                  Submit your solution
                </CTALinkOrButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

PuzzleTechnicalAiSafetyPage.pageRendersOwnNav = true;

export default PuzzleTechnicalAiSafetyPage;
