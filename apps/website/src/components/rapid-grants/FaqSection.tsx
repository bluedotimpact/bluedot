import FAQSection from '../lander/components/FAQSection';

const FAQ_ITEMS = [
  {
    id: 'unsure',
    question: 'Should I apply if I\'m not sure it\'s a fit?',
    answer: 'Yes. If the work\'s underway and the need is specific, just apply. Don\'t talk yourself out of it.',
  },
  {
    id: 'eligibility',
    question: 'Who is eligible?',
    answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you\'re in our network and doing serious AI safety work, you qualify.',
  },
  {
    id: 'events',
    question: 'Can Rapid Grants fund events or meetups?',
    answer: 'Yes. We have funded meetup series, venue costs, and community events in multiple countries. Show us the plan and the specific costs.',
  },
  {
    id: 'reimbursement',
    question: 'Do you fund upfront or reimburse later?',
    answer: 'Both. Usually we send the money upfront; sometimes we reimburse instead. We\'ll tell you which when we approve.',
  },
  {
    id: 'travel',
    question: 'Can Rapid Grants cover travel?',
    answer: 'Yes. We fund travel for conferences, collaboration, and fieldwork. Show us why being there matters for the work.',
  },
  {
    id: 'larger-request',
    question: 'What if I need more than a few thousand dollars?',
    answer: 'Rapid Grants run from $50 to $10,000. If you need more, get in touch. We can sometimes route you through another program.',
  },
];

const FaqSection = () => {
  return (
    <FAQSection
      id="rapid-grants-faq"
      title="Frequently asked questions"
      items={FAQ_ITEMS}
      background="canvas"
    />
  );
};

export default FaqSection;
