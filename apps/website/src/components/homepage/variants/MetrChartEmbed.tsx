import {
  H2, P, Section,
} from '@bluedot/ui';

const MetrChartEmbed = () => (
  <Section className="py-12 md:py-16 lg:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-white">
    <div className="mx-auto max-w-screen-xl flex flex-col items-center gap-10 lg:gap-12">
      <div className="flex flex-col items-center gap-5 text-center max-w-3xl">
        <P className="text-size-xs font-medium tracking-[1.5px] uppercase text-bluedot-navy/60">
          Why this matters now
        </P>
        <H2 className="text-[28px] md:text-[36px] lg:text-[44px] xl:text-[52px] leading-[1.1] tracking-[-1px] font-medium text-bluedot-navy">
          AI capability is doubling every 7 months.
        </H2>
        <P className="text-size-md leading-[1.6] text-bluedot-navy/75 max-w-2xl">
          The length of tasks AI agents can complete autonomously is growing exponentially. At this rate, by 2030 a single model handles a month of work in one sitting.
        </P>
      </div>

      {/* Chart embed */}
      <figure className="w-full max-w-5xl flex flex-col gap-3">
        <a
          href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
          target="_blank"
          rel="noreferrer noopener"
          className="block rounded-xl border border-bluedot-navy/10 overflow-hidden bg-white p-4 md:p-6 lg:p-8 hover:border-bluedot-navy/20 transition-colors group"
        >
          <img
            src="/images/homepage-variants/metr-chart.png"
            alt="Chart from METR showing the length of tasks AI agents can complete with 50 percent reliability has doubled approximately every seven months from 2019 to 2025."
            className="w-full h-auto"
          />
        </a>
        <figcaption className="text-size-xs text-bluedot-navy/60 px-1">
          Length of tasks AI agents can complete autonomously, doubling roughly every 7 months. Chart by{' '}
          <a
            href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:no-underline"
          >
            METR
          </a>
          {' '}(Model Evaluation & Threat Research).
        </figcaption>
      </figure>
    </div>
  </Section>
);

export default MetrChartEmbed;
