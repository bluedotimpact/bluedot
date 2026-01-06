import { isMobile } from 'react-device-detect';
import { P, Section } from '@bluedot/ui';

const HistorySection = () => {
  return (
    <Section className="history-section" title="Our history">
      <div className="history-section__container flex flex-col sm:flex-row sm:gap-2 gap-8">
        <HistoryEvent year="2021">Before BlueDot, we <strong>began as a University of Cambridge student group</strong>, hosting discussions on transformative emerging technologies.</HistoryEvent>
        <HistoryEvent year="2022"><strong>Launched our first AI Safety course</strong> with 400+ participants, <strong>founded BlueDot Impact</strong>, and established our <strong>London headquarters</strong>.</HistoryEvent>
        <HistoryEvent year="2023">Delivered a new course every four months, <strong>training 800+ people in AI Alignment, Governance, and Biosecurity</strong>.</HistoryEvent>
        <HistoryEvent year="2024">Accelerated to monthly courses, <strong>reaching 3,500+ participants worldwide</strong>. Over <strong>400</strong> of our course graduates now work in AI Safety.</HistoryEvent>
        <HistoryEvent year="2025" now>Launching multiple courses weekly and expanding a world-class team to <strong>scale our global impact</strong>.</HistoryEvent>
      </div>
    </Section>
  );
};

const HistoryEvent = ({ year, now, children }: { year: string, now?: boolean, children: React.ReactNode }) => {
  return (
    <div className="history-section__event flex-1">
      {isMobile ? (
        <div className={
          `history-section__event-container--mobile w-full flex flex-row gap-12 p-8
          ${now ? 'border bg-bluedot-lighter border-bluedot-light rounded-xl' : 'container-lined'}`
        }
        >
          <strong className="history-section__year">{year}</strong>
          <P className="history-section__event-details">{children}</P>
        </div>
      ) : (
        <div className="history-section__event-container--desktop flex flex-col gap-space-between">
          <div className="history-section__year-container w-full flex gap-2">
            <P className="history-section__year bg-bluedot-normal rounded-full px-4 py-2 text-color-text-on-dark text-[16px] font-bold w-min">{year}</P>
            <div className="history-section__year-decoration relative w-full after:content-[''] after:absolute after:top-1/2 after:w-full after:h-[2px] after:bg-bluedot-normal after:right-0" />
          </div>
          <P className="history-section__event-details mr-12">{children}</P>
        </div>
      )}
    </div>
  );
};

export default HistorySection;
