import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const HistorySection = () => {
  return (
    <section className="history-section section section-body">
      <h3 className={`${pageSectionHeadingClass} mb-6`}>Our history</h3>
      <div className="history-section__container flex flex-col lg:flex-row lg:gap-2 gap-8">
        <HistoryEvent year="2021">Started as reading groups at the University of Cambridge.</HistoryEvent>
        <HistoryEvent year="2022">Founded BlueDot Impact. Launched our first AI safety course with 400 participants.</HistoryEvent>
        <HistoryEvent year="2023">Expanded to AI governance and biosecurity. Trained 900. Moved to London.</HistoryEvent>
        <HistoryEvent year="2024">Trained 3,500. Raised $5M.</HistoryEvent>
        <HistoryEvent year="2025">Launched monthly courses. Raised $25M. Announced SF expansion.</HistoryEvent>
      </div>
    </section>
  );
};

const HistoryEvent = ({ year, children }: { year: string; children: React.ReactNode }) => {
  return (
    <div className="history-section__event flex-1">
      <div className="history-section__event-container--desktop flex flex-col gap-space-between">
        <div className="history-section__year-container w-full flex gap-2">
          <P className="history-section__year bg-bluedot-normal rounded-full px-4 py-2 text-color-text-on-dark text-[16px] font-bold w-min">{year}</P>
          <div className="history-section__year-decoration relative w-full after:content-[''] after:absolute after:top-1/2 after:w-full after:h-[2px] after:bg-bluedot-normal after:right-0" />
        </div>
        <P className="history-section__event-details mr-12">{children}</P>
      </div>
    </div>
  );
};

export default HistorySection;
