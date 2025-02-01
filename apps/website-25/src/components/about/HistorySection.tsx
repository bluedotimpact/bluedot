import { Section } from '@bluedot/ui';

const HistorySection = () => {
  return (
    <Section className="history-section" title="Our history">
      <div className="history-section__container flex flex-col gap-8">
        <HistoryEvent year="2021" event="Before BlueDot, we began as a University of Cambridge student group, hosting discussions on transformative emerging technologies." />
        <HistoryEvent year="2022" event="Launched our first AI Safety course with 400+ participants, founded BlueDot Impact, and established our London headquarters." />
        <HistoryEvent year="2023" event="Delivered a new course every four months, training 800+ people in AI Alignment, Governance, and Biosecurity." />
        <HistoryEvent year="2024" event="Accelerated to monthly courses, reaching 3,000+ participants worldwide. Over 400 of our course graduates now work in AI Safety." />
        <HistoryEvent year="2025" event="Launching multiple courses weekly and expanding a world-class team to scale our global impact." now />
      </div>
    </Section>
  );
};

const HistoryEvent = ({ year, event, now }: { year: string, event: string, now?: boolean }) => {
  return (
    <div className={
        `history-section__event-container w-full flex flex-row gap-12 p-8 ${now ? 'border bg-bluedot-lighter border-bluedot-light rounded-xl' : 'container-lined'}`
      }
    >
      <strong className="history-section__year">{year}</strong>
      <p className="history-section__event-title">{event}</p>
    </div>
  );
};

export default HistorySection;
