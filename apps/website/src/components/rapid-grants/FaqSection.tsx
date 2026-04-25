import FAQSection from '../lander/components/FAQSection';

const FAQ_ITEMS = [
  {
    id: 'unsure',
    question: 'Should I apply if I am not sure the request is a fit?',
    answer: 'Yes. If the work is underway and the need is concrete, applying is usually better than self-screening out too early.',
  },
  {
    id: 'eligibility',
    question: 'Who is eligible?',
    answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you are in our network and doing excellent work on AI safety, you are likely eligible.',
  },
  {
    id: 'events',
    question: 'Can Rapid Grants fund events or meetups?',
    answer: 'Yes. We have funded meetup series, venue costs, and community events in multiple countries. Show us the plan and the specific costs.',
  },
  {
    id: 'reimbursement',
    question: 'Do you fund upfront or reimburse later?',
    answer: 'Both. In many cases we send the money upfront as a grant, and in other cases we reimburse later.',
  },
  {
    id: 'travel',
    question: 'Can Rapid Grants cover travel?',
    answer: 'Yes. We fund travel for conferences, collaboration, and fieldwork. Show us why being there matters for the work.',
  },
  {
    id: 'larger-request',
    question: 'What if I need more than a few thousand dollars?',
    answer: 'Rapid Grants typically range from $50 to $10,000. If your need is substantially larger, get in touch - we may be able to help through another program.',
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
