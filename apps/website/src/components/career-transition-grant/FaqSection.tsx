import FAQSection from '../lander/components/FAQSection';

const FAQ_ITEMS = [
  {
    id: 'eligibility',
    question: 'Who is eligible?',
    answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you are in our network and doing excellent work on AI safety, you are likely eligible.',
  },
  {
    id: 'uncertain',
    question: 'Should I apply if I don\'t know exactly how to contribute to AI safety yet?',
    answer: 'Yes. We do not expect you to have it all figured out. We would rather see a clear-eyed account of what you do not know and a plan for finding out.',
  },
  {
    id: 'circumstances-change',
    question: 'What if I secure a full-time role or my circumstances change during the grant?',
    answer: 'Please let us know. Any remaining funds would be returned to BlueDot.',
  },
];

const FaqSection = () => {
  return (
    <FAQSection
      id="career-transition-grant-faq"
      title="Frequently asked questions"
      items={FAQ_ITEMS}
      background="canvas"
    />
  );
};

export default FaqSection;
