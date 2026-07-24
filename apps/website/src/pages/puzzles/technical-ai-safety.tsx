import Head from 'next/head';
import {
  CTALinkOrButton, Eyebrow, H1, P,
} from '@bluedot/ui';
import { Nav } from '../../components/Nav/Nav';
import { COURSE_COLORS } from '../../lib/courseColors';

const SITE_URL = 'https://bluedot.org';
const PAGE_PATH = '/puzzles/technical-ai-safety';
const PAGE_TITLE = 'Technical AI Safety Puzzle #1';
const PAGE_HOOK = 'Most neural networks represent features linearly in their activations. Ours doesn’t.';
const PAGE_SUBTITLE = 'Most neural networks represent features linearly in their activations. Ours doesn’t. Can you interpret it?';

const PUZZLE_URL = 'https://colab.research.google.com/github/SamDower/bluedot-tais-puzzle/blob/main/puzzle.ipynb';
const PUZZLE_IMAGE_SRC = '/images/puzzles/technical-ai-safety/puzzle.webp';
const OG_IMAGE_URL = `${SITE_URL}/images/puzzles/technical-ai-safety/og.png`;

const TAS = COURSE_COLORS['technical-ai-safety'];

const SECTION_CONTAINER_CLASS = 'max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-spacing-x';
const SECTION_PADDING_CLASS = `${SECTION_CONTAINER_CLASS} py-6 bd-md:py-8 lg:py-10`;
const EYEBROW_CLASS = 'text-size-xxs font-medium uppercase tracking-wide text-bluedot-navy/60';

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
  {
    place: '1st place', amount: '$1,000', medal: '🥇', winners: ['Gustavo Korzune Gurgel'],
  },
  {
    place: '2nd place', amount: '$750', medal: '🥈', winners: ['Patryk Perduta'],
  },
  {
    place: '3rd place', amount: '$500', medal: '🥉', winners: ['Sam Spillard'],
  },
  {
    place: 'Honourable mentions', amount: '$250 each', medal: '🏅', winners: ['Karine Levonyan', 'Phu Gia Hoang', 'Michael Zlatin'],
  },
] as const;

const [FIRST_PRIZE, ...RUNNER_UP_PRIZES] = PRIZES;

const CORRECT_SUBMISSIONS = [
  'Abderrahmene Hamdi',
  'Abdullah X',
  'Abhinav Chand',
  'Adam Webb',
  'Aditya Suresh',
  'Adrit Chaudhuri',
  'Adyasha Patra',
  'Agustin Brusco',
  'Akshit Jindal',
  'Alexandros (Alex) Doumanoglou',
  'Alexei Gannon',
  'Alfred Muir',
  'Ali Al Sahili',
  'Amen Abebe Gebreyohanes',
  'Anay Dongre',
  'Andrej Kotevski',
  'Aneetej Arora',
  'Anshuman Singh',
  'Archie Licudi',
  'Aresh Pourkavoos',
  'Ariana Villegas Suarez',
  'Arjhun Swaminathan',
  'Art Moskvin',
  'Artem Zhuravel',
  'Astley F',
  'Atharv Kshirsagar',
  'Baijun Qiao',
  'Brody McNutt',
  'Carmen Hilbert',
  'Cedric Kopp',
  'Collin Francel',
  'Dabal Pedamonti',
  'Daniel Tennant',
  'Daniel Zhang',
  'Dauzhan Beketov',
  'David Zeidler',
  'Denis Lim',
  'Diego Oliver',
  'Edward Cant',
  'Elsie Jang',
  'Emily Chen',
  'Emma Kong',
  'Eric Enouen',
  'Eric Todd',
  'Ethan Kuntz',
  'Evan Redden',
  'Fan Wu',
  'Felix Marti-Perez',
  'Girish Koushik',
  'Goutham Nalagatla',
  'Gustavo Korzune Gurgel',
  'Han Xiao',
  'Harinarayan Asoori Sriram',
  'Harshvardhan Saini',
  'Hugo De Bosschere',
  'Husam Usman',
  'Ian Nielsen',
  'Igor Pereverzev',
  'Ishaan Shrivastava',
  'Jacob Ortiz',
  'Jan Ebbing',
  'Janmenjaya Panda',
  'Javier Masis',
  'Jishu Sen Gupta',
  'Johan Daniel',
  'Julian Quick',
  'Justin Shenk',
  'Karine Levonyan',
  'Karly Hou',
  'Kiran Pal',
  'kushal garg',
  'Lasse Jantsch',
  'lloyd situmbeko',
  'Mahesh Pandit',
  'Maksim Silchenko',
  'Matthew Duff',
  'Maximilian Plattner',
  'Mayank Kamboj',
  'Michael Hanna',
  'Michael Zlatin',
  'Michał Burzyński',
  'Mihir Sahasrabudhe',
  'Minh Hoang',
  'Nathanaël Fijalkow',
  'Neerav Durejs',
  'Nichita Mitrea',
  'Nikoloz Gegenava',
  'Nilanjan Sarkar',
  'Nithil Ravikumar',
  'Noè Canevascini',
  'Ojonugwa Ejiga Peter',
  'Oliver Sieweke',
  'Olivia Zhang',
  'Omar Darwish',
  'Omari March',
  'Owen Sweeney',
  'Parin Thakkar',
  'Patrick O\'Donnell',
  'Patryk Perduta',
  'Pavan Kumar Dubasi',
  'Phu Gia Hoang',
  'Pol Pastells',
  'Razan Alsulieman',
  'Richie Mendelsohn',
  'Robin Haselhorst',
  'Rohit Kaushik',
  'Roksana Goworek',
  'Roman Kniazev',
  'Sahil Kapadia',
  'Sam Spillard',
  'Samuel Liew',
  'Santiago Maniches',
  'Sean Murphy',
  'Sharat Jacob',
  'Shiv Munagala',
  'Shivang Kumar Dubey',
  'Shubh Varshney',
  'Sidar Aslanoglu',
  'Simon Elias Schrader',
  'Soham Takawadekar',
  'Suman Kumar Subudhi',
  'Sumit Vekariya',
  'Syed Adil Ahmed',
  'Teunis Mulder',
  'Thomas Johnson',
  'Ti-Lin Chou',
  'Tobias Bersia',
  'Tommy Mancino',
  'Tomás Korenblit',
  'Tuyen Tran',
  'Uday Phalak',
  'Utsav Shah',
  'Uttirn Gyan',
  'Varsha Otta',
  'Vayk Mathrani',
  'Venkat T',
  'Viraaj Minhas',
  'Vishesh Gupta',
  'Yash Bhisikar',
] as const;

// Correct submitters who asked not to be named publicly.
const UNNAMED_SUBMISSIONS_COUNT = 14;

const PuzzleTechnicalAiSafetyPage = () => {
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
              <H1 className="text-size-xl">
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
              <P className="mt-4 text-size-md leading-relaxed">
                We trained a model on short text inputs to predict eight binary features simultaneously (e.g. contains a person&rsquo;s name, mentions a food, phrased as a question). After a particular layer of this model, seven of these features are represented linearly, where a single direction in the activation space describes that feature. However, one feature is represented in a different way.
              </P>
              <P className="mt-4 text-size-md leading-relaxed">
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
              <div className="mt-6 flex justify-center">
                <CTALinkOrButton
                  url={PUZZLE_URL}
                  size="small"
                  className="h-11 lg:h-12 px-6 lg:px-7 text-size-sm font-semibold rounded-md text-white hover:brightness-110"
                  style={{ backgroundColor: TAS.full }}
                >
                  See the puzzle
                </CTALinkOrButton>
              </div>
            </div>
          </div>
        </section>

        {/* Winners */}
        <section>
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>Winners</h2>
              <div
                className="mt-5 rounded-lg border border-color-divider p-6 lg:p-8 text-center"
                style={{ backgroundColor: TAS.bright }}
              >
                <p className="text-size-xl leading-none">{FIRST_PRIZE.medal}</p>
                <Eyebrow className="mt-3" style={{ color: TAS.full }}>
                  {FIRST_PRIZE.place} · {FIRST_PRIZE.amount}
                </Eyebrow>
                <p className="mt-2 text-size-lg font-semibold text-bluedot-navy">
                  {FIRST_PRIZE.winners[0]}
                </p>
              </div>
              <div className="mt-4 grid bd-md:grid-cols-3 gap-4">
                {RUNNER_UP_PRIZES.map((p) => (
                  <div key={p.place} className="rounded-lg border border-color-divider p-5 text-center">
                    <p className="text-size-lg leading-none">{p.medal}</p>
                    <Eyebrow className="mt-3 text-bluedot-navy/60">
                      {p.place} · {p.amount}
                    </Eyebrow>
                    <ul className="mt-2 space-y-0.5">
                      {p.winners.map((name) => (
                        <li key={name} className="text-size-sm font-semibold text-bluedot-navy leading-snug">
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Correct submissions */}
        <section className="bg-color-canvas">
          <div className={SECTION_PADDING_CLASS}>
            <div className="max-w-text mx-auto">
              <h2 className={EYEBROW_CLASS}>Correct submissions</h2>
              <div className="mt-4 rounded-lg border border-color-divider p-6 lg:p-8">
                <ul className="columns-2 bd-md:columns-3 lg:columns-4 gap-x-6 space-y-1.5">
                  {CORRECT_SUBMISSIONS.map((name) => (
                    <li
                      key={name}
                      className="break-inside-avoid text-size-sm text-bluedot-navy/80 leading-relaxed"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-size-xs text-bluedot-navy/50 leading-relaxed">
                  ...and {UNNAMED_SUBMISSIONS_COUNT} others who chose not to be named.
                </p>
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
