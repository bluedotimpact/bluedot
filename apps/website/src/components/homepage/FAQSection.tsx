import { Collapsible, Section } from '@bluedot/ui';
import { A, P } from '../Text';

const FAQSection = () => {
  return (
    <Section className="faq-section !overflow-visible" title="Frequently asked questions">
      <Collapsible className="faq-section__item" title="What is AI Safety?">
        <P>AI Safety is the field working to ensure powerful AI systems benefit rather than harm humanity. As AI systems become more capable of affecting our world, we need to solve key challenges: How do we make AI systems reliably do what we want? How do we govern their development? How do we define what "beneficial" means?</P>
        <P>You can read more about these <A href="https://aisafetyfundamentals.com/blog/what-is-ai-alignment/">different aspects of AI safety here</A> and the <A href="https://aisafetyfundamentals.com/blog/ai-risks/">range of AI risks here</A>.</P>
      </Collapsible>
      <Collapsible className="faq-section__item" title="How can I maximise my chances of getting accepted onto the courses?">
        <P>Check you are the <A href="https://bluedot.org/blog/am-i-the-right-fit-for-bluedots-courses/">right fit</A> and read our tips for making a <A href="https://aisafetyfundamentals.com/blog/avoid-governance-application-mistakes/">great application.</A></P>
      </Collapsible>
      <Collapsible className="faq-section__item" title="I’d like to run your course with my work/university/group of friends. Can you help with training and materials?">
        <P>We’d love for you to do this! All our reading and discussion materials are freely available online. You are welcome to run a local version of our course so long as you <A href="https://bluedot.org/running-versions-of-our-courses/">follow our guidelines</A>.
        </P>
        <P>If you want tips for your discussion facilitation, we recommend taking a look through our <A href="https://course.bluedot.org/home/facilitator-training">facilitator training course</A>.</P>
      </Collapsible>
    </Section>
  );
};

export default FAQSection;
