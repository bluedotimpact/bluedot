import {
  CTALinkOrButton,
  HeroSection,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';

const JobPostingPage = () => {
  return (
    <div>
      <Head>
        <title>Software Engineering Contractor | BlueDot Impact</title>
      </Head>
      <HeroSection>
        <h1 className="hero-section__title text-on-dark text-center">Software Engineering Contractor</h1>
        <h2 className="hero-section__subtitle text-on-dark text-2xl font-[400] text-center mt-4">We’re building a database of high-trust, agile software engineers to help us out on future contractor work.</h2>
        <div className="flex justify-center mt-8">
          <CTALinkOrButton url="https://web.miniextensions.com/4XjNSRhWiAUBc1UTDZS3?prefill_Role=recuN8LCYMMsZZmNC">Join our hiring pool</CTALinkOrButton>
        </div>
      </HeroSection>
      <Section className="prose">
        <h2>About BlueDot Impact</h2>
        <p>We're a startup non-profit helping people create a better future for humanity by designing and running courses on some of the world's most pressing problems. We find people who could have enormous impact, motivate and equip them via our courses, and connect them with impactful opportunities.</p>
        <p>The team is roughly split in two: focus area specialists who design the courses, and the product/software team who build and improve the course infrastructure. You'll be collaborating with our team on an as-needed project basis, working closely with <a href="https://linkedin.com/in/tarinrickett">Tarin</a> (Engineering), <a href="https://www.linkedin.com/in/vioricagheorghita/">Vio</a> (Product), <a href="https://www.linkedin.com/in/anglilian?originalSubdomain=uk">Li-Lian</a> (Product), and <a href="https://adamjones.me/">Adam</a> (AI Safety and some software).</p>
        <p>We're grateful to be supported by <a href="https://www.openphilanthropy.org/">Open Philanthropy</a>, and we've raised <strong>$4M thus far</strong>. We're now <a href="https://bluedot.org/blog/case-for-support-2024-2026/">fundraising</a> for a <strong>further $5M</strong> to support our work over the next two years.</p>
        <p>Learn more about other open roles and our team values on our <a href="https://bluedot.org/careers">Careers page</a>.</p>
        <h2>What you'll do</h2>
        <p>We'll recruit from this list as project work becomes available, partnering together on a variety of tasks from business automations and scaling our existing product infrastructure (like <a href="https://course.aisafetyfundamentals.com/alignment">Course Hub</a>) to scrappy web app prototyping. Opportunities are flexible and may vary in time commitments from 1 hour to 100+, depending on your interest and project need.</p>
        <p>Your work will have a <strong>huge impact on the pipeline of people going into AI Safety and biosecurity</strong>, by helping us scale and improve the most popular courses on those topics. Our AI safety courses are the main pathway by which people go from "interested in AI safety" to "working in AI safety." If you're a software engineer and want to contribute to these fields, this is a great opportunity to use your existing skills to improve the world.</p>
        <h2>About you</h2>
        <p>You might be a great fit for this role if you:</p>
        <ul>
          <li>Aspire to build amazing user experiences, with an understanding of how to execute high-quality product development while balancing for execution speed.</li>
          <li>Have strong documentation skills, writing clean and maintainable code while upholding best practices.</li>
          <li>Adapt quickly to new environments, with a self-driven attitude and high capability to independently diagnose complex problems and generate many ideas on how to solve them.</li>
          <li>Have 1-2 years of software engineering experience, coding in TypeScript or another high-level programming language.</li>
        </ul>
        <p><strong>We encourage speculative applications</strong>; we expect many strong candidates will not meet all of the criteria listed here.</p>
        <p>We believe that a more diverse team leads to a healthier and happier workplace culture, better decision-making, and greater long-term impact. In this spirit, <strong>we especially encourage people from underrepresented groups to apply to this role</strong>, and to join us in our mission to help solve the world's biggest problems.</p>
        <h2>Location and compensation</h2>
        <p><strong>Location:</strong> Hybrid in London, UK (preferred) or fully remote. We accept applications from anywhere in the world.</p>
        <p><strong>Compensation:</strong> £30-50/hour. You will be hired as a contractor and responsible for your own taxes. You can also do this as an unpaid volunteer for visa or conflict of interest reasons – opting to go without payment will have no effect on whether we select you for this role.</p>
        <p><strong>Times:</strong> UK hours preferred (9:30am to 5pm-6pm). We can accommodate other timezones provided there is at least 3 hours overlap with UK hours.</p>
        <h2>Register interest</h2>
        <p>We encourage you to <strong>register interest as soon as possible</strong>. We evaluate candidates from our hiring pool on a rolling basis as project work becomes available.</p>
        <p>If you have any questions about the role, email tarin [at] bluedot [dot] org.</p>
        <div className="not-prose my-8">
          <CTALinkOrButton url="https://web.miniextensions.com/4XjNSRhWiAUBc1UTDZS3?prefill_Role=recuN8LCYMMsZZmNC">Join our hiring pool</CTALinkOrButton>
        </div>
      </Section>
    </div>
  );
};

export default JobPostingPage;
