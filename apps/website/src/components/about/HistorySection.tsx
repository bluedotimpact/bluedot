import { H3, P } from '@bluedot/ui';

const HistorySection = () => {
  return (
    <section className="section section-body">
      <H3 className="mb-6">Our history</H3>
      <div className="flex flex-col lg:flex-row lg:gap-2 gap-8">
        <HistoryEvent year="2021">Started as reading groups at the University of Cambridge.</HistoryEvent>
        <HistoryEvent year="2022">Founded BlueDot Impact. Launched our first AI safety course with 400 participants.</HistoryEvent>
        <HistoryEvent year="2023">Expanded to AI governance and biosecurity. Trained 900. Moved to London.</HistoryEvent>
        <HistoryEvent year="2024">Trained 3,500. Raised $5M.</HistoryEvent>
        <HistoryEvent year="2025">Launched monthly courses. Raised $25M. Announced SF expansion.</HistoryEvent>
        <HistoryEvent year="2026">Moved our headquarters to San Francisco. Trained over 10,000 people.</HistoryEvent>
      </div>
    </section>
  );
};

const HistoryEvent = ({ year, children }: { year: string; children: React.ReactNode }) => {
  return (
    <div className="flex-1">
      <div className="flex flex-col gap-space-between">
        <div className="w-full flex gap-2">
          <P className="bg-accent rounded-full px-4 py-2 text-on-dark text-size-sm font-bold w-min">{year}</P>
          <div className="relative w-full after:content-[''] after:absolute after:top-1/2 after:w-full after:h-[2px] after:bg-accent after:right-0" />
        </div>
        <P className="mr-12">{children}</P>
      </div>
    </div>
  );
};

export default HistorySection;
