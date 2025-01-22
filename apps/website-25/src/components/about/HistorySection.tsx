import { Section } from '@bluedot/ui';

const HistorySection = () => {
  return (
    <Section className="history-section" title="Our History">
      <div className="history-section__container flex flex-col gap-8 my-14">
        <HistoryEvent year="2021" event="A non-profit supporting students at the University of Cambridge to pursue high-impact careers" />
        <HistoryEvent year="2022" event="Growing into a new start-up called “BlueDot Impact” and moved headquarters to London" />
        <HistoryEvent year="2023" event="BlueDot Impact is now running 1 training course every 4 months and trains over xxx people in AI Safety and Biosecurity" />
        <HistoryEvent year="2024" event="BlueDot Impact is now running courses every 6 weeks and trains over 2500 professionals in AI Safety and Biosecurity" />
        <HistoryEvent year="2025" event="BlueDot is now running multiple courses in parallel every week! We are scaling the team to accelerate our impact!" now />
      </div>
    </Section>
  );
};

const HistoryEvent = ({ year, event, now }: { year: string, event: string, now?: boolean }) => {
  return (
    <div className={
        `history-section__event-container w-full flex flex-row gap-12 p-8 border-solid border-[1px] rounded-2xl
          ${now ? 'bg-bluedot-lighter border-bluedot-light' : 'border-gray-200'}`
      }
    >
      <strong className="history-section__year">{year}</strong>
      <p className="history-section__event-title">{event}</p>
    </div>
  );
};

export default HistorySection;
