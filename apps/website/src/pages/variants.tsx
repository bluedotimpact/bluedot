import Head from 'next/head';
import { Nav } from '../components/Nav/Nav';

type Variant = {
  number: number;
  href: string;
  title: string;
  shape: string;
  oneLiner: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    number: 1,
    href: '/1',
    title: 'Surgical insertion',
    shape: 'Lowest-risk shipper',
    oneLiner: 'Drop a single FoAI callout above the existing course grid. Nothing else changes.',
    pros: ['Ships in <1 week', 'Easy A/B + rollback', 'Doesn\'t touch the hero'],
    cons: ['Reads as "another section"', 'No narrative connection to AGISC', 'Risks "BlueDot is for normies"'],
  },
  {
    number: 2,
    href: '/2',
    title: 'Three-rung ladder',
    shape: 'Learn → Engage → Lead',
    oneLiner: 'Replace the courses + programs sections with a single 3-rung ladder. Every visitor sees the same path.',
    pros: ['Ladder = clear path', 'Maps to Will\'s Unit 4 rebuild', 'Skip-ahead link handles selectivity'],
    cons: ['2-3 weeks to build', 'Removes existing "Go beyond a course" framing', 'Can read as didactic'],
  },
  {
    number: 3,
    href: '/3',
    title: 'Dual-door hero',
    shape: 'Above-the-fold routing',
    oneLiner: 'Rebuild the hero with two equal CTAs: "Just exploring" → FoAI / "Ready to commit" → AGISC.',
    pros: ['Highest above-fold conversion', 'Honest about two paths', 'Clean A/B test'],
    cons: ['Loudest possible signal', 'Highest cannibalisation risk', 'Hero rebuild is most visible change'],
  },
  {
    number: 4,
    href: '/4',
    title: 'Inline taster',
    shape: 'Product-led, demo-first',
    oneLiner: 'Show a "what AI can do, 2020 → 2026" capability progression on the homepage itself.',
    pros: ['Differentiated from every AI org', 'Likely lifts FoAI funnel', 'Brand at its best'],
    cons: ['6-8 weeks if scrolly', 'Sequenced behind FoAI v2', 'Hard to A/B fairly'],
  },
  {
    number: 5,
    href: '/5',
    title: 'Editorial reframe',
    shape: 'Institutional voice',
    oneLiner: 'Reposition as "the institution that explains where AI is going, and runs the courses to do something." FoAI is the front door.',
    pros: ['Strongest filter for exceptional people', 'Forces brand coherence', 'Doubles as values statement'],
    cons: ['Biggest rebuild (6-10 weeks)', 'Lowest reversibility', 'Risk of stale manifesto'],
  },
  {
    number: 6,
    href: '/6',
    title: 'Editorial hero + ladder',
    shape: 'Recommended merge of /2 + /5',
    oneLiner: 'V5\'s manifesto hero copy on the existing homepage hero shell, METR chart, then V2\'s three rungs with the 720px and Rung-3 fixes.',
    pros: ['Story end-to-end on real chrome', 'Reuses existing components', 'Skip-link handles selectivity'],
    cons: ['Sequenced behind FoAI v2', 'Long mobile scroll', 'Most copy to land in Dewi\'s voice'],
  },
];

const VariantCard = ({ variant }: { variant: Variant }) => (
  <a
    href={variant.href}
    className="group flex flex-col rounded-xl border border-bluedot-navy/10 bg-white overflow-hidden hover:border-bluedot-navy/30 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-start justify-between p-6 md:p-7 border-b border-bluedot-navy/5">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-full bg-bluedot-navy text-white font-medium flex items-center justify-center text-size-md">
          {variant.number}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-size-xxs font-medium uppercase tracking-[1.5px] text-bluedot-navy/55">
            {variant.shape}
          </span>
          <h3 className="text-size-lg md:text-[24px] font-medium text-bluedot-navy tracking-[-0.3px]">
            {variant.title}
          </h3>
        </div>
      </div>
      <span className="text-bluedot-navy/40 group-hover:text-bluedot-navy text-size-lg pt-1">→</span>
    </div>
    <div className="flex flex-col gap-5 p-6 md:p-7 flex-1">
      <p className="text-size-sm leading-[1.55] text-bluedot-navy/80">
        {variant.oneLiner}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
        <div className="flex flex-col gap-2">
          <span className="text-size-xxs font-medium uppercase tracking-[1.2px] text-bluedot-navy/55">Pros</span>
          <ul className="flex flex-col gap-1">
            {variant.pros.map((p) => (
              <li key={p} className="text-size-xs text-bluedot-navy/75 leading-[1.5]">{p}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-size-xxs font-medium uppercase tracking-[1.2px] text-bluedot-navy/55">Cons</span>
          <ul className="flex flex-col gap-1">
            {variant.cons.map((c) => (
              <li key={c} className="text-size-xs text-bluedot-navy/75 leading-[1.5]">{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </a>
);

const VariantsIndex = () => (
  <div className="min-h-screen bg-[#FAFAF7]">
    <Head>
      <title>FoAI homepage variants | BlueDot Impact</title>
      <meta name="robots" content="noindex" />
    </Head>
    <Nav />
    <main className="px-5 bd-md:px-8 lg:px-12 py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-screen-xl flex flex-col gap-10 lg:gap-14">
        <div className="flex flex-col gap-5 max-w-3xl">
          <span className="text-size-xs font-medium tracking-[1.5px] uppercase text-bluedot-navy/55">
            Internal eval
          </span>
          <h1 className="text-[32px] md:text-[44px] lg:text-[52px] leading-[1.1] tracking-[-1px] font-medium text-bluedot-navy">
            Five ways to put The Future of AI back on the homepage.
          </h1>
          <p className="text-size-md leading-[1.6] text-bluedot-navy/75">
            Each link below is a working homepage variant. Open them on any viewport and click around. Decide on feel, not just text.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8">
          {VARIANTS.map((v) => (
            <VariantCard key={v.number} variant={v} />
          ))}
        </div>

        <div className="text-size-sm text-bluedot-navy/60 max-w-3xl border-t border-bluedot-navy/10 pt-6">
          <p>
            Strategy doc: <code className="text-size-xs">/tmp/claude/foai-homepage-options.md</code>. The weighted model picks Variant 2. Variants 4 and 5 are the harder builds and take the most reversibility risk; Variant 1 is the cheapest test.
          </p>
        </div>
      </div>
    </main>
  </div>
);

VariantsIndex.pageRendersOwnNav = true;

export default VariantsIndex;
