import { Collapsible, Section } from '@bluedot/ui';

const FAQSection = () => {
  return (
    <Section className="faq-section" title="Frequently asked questions">
      <Collapsible title="How can I maximise my chances of getting accepted onto the courses?">
        <p>Check you are the <a href="https://bluedot.org/blog/am-i-the-right-fit-for-bluedots-courses/">right fit</a> and read our tips for making a <a href="https://aisafetyfundamentals.com/blog/avoid-governance-application-mistakes/">great application.</a></p>
      </Collapsible>
      <Collapsible title="I’d like to run your course for my work/university/ local AIS group… can you help with training and materials?">
        <p>We are excited that you want to <a href="https://bluedot.org/running-versions-of-our-courses/">run a version of our courses</a> and will support you in any way we can. A good place to start is by looking through our <a href="https://course.bluedot.org/home/facilitator-training">facilitator training course</a> curriculum.</p>
      </Collapsible>
      <Collapsible title="Who funds your work?">
        <p>BlueDot Impact is primarily funded by <a href="https://www.openphilanthropy.org/">Open Philanthropy</a>, and is a non-profit based in the UK (company number <a href="https://find-and-update.company-information.service.gov.uk/company/14964572">14964572</a>). Our courses are free but upon course completion we give our participants the opportunity to <a href="https://donate.stripe.com/5kA3fpgjpdJv6o89AA">Support Us</a>.</p>
      </Collapsible>
      <Collapsible title="How can I collaborate/partner with BlueDot Impact on AI safety initiatives?">
        <p>We love to hear from potential collaborators so please <a href="https://bluedot.org/contact/">reach out</a>.</p>
      </Collapsible>
      <Collapsible title="How can I stay informed about BlueDot Impact’s latest roles?">
        <p>Please see more information about our job openings <a href="/careers">here</a> including an <a href="https://airtable.com/appB9rItpTpWkNqEI/shrulKbUxr7NhgnKJ">expression of interest form</a>.</p>
      </Collapsible>
    </Section>
  );
};

export default FAQSection;
