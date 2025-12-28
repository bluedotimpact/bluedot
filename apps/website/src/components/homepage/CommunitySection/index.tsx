// import { CommunityStats } from './CommunityStats';
import { Section } from '@bluedot/ui';
import ProjectsSubSection from './ProjectsSubSection';
import TestimonialSection, { Testimonial } from './TestimonialSubSection';
import CommunityValuesSection from './CommunityValuesSection';

const testimonials: Testimonial[] = [
  {
    quote: "This was the most positively impactful course I've ever taken (unless you count the high school class in which I got to know my husband!), as it gave me the background to engage with the AI safety and governance communities. I don't know how I would have gotten up to speed otherwise, and it opened the door to pretty much everything I've done professionally for the past couple years.",
    name: 'Kendrea Beers',
    role: 'Horizon Junior Fellow at the Center for Security and Emerging Technology',
    imageSrc: '/images/graduates/kendrea.webp',
  },
  {
    quote: "I participated in the AISF Alignment Course last year and consider it to be the single most useful step I've taken in my career so far. I cannot recommend the program strongly enough",
    name: 'Sarah Cogan',
    role: 'Software Engineer at Google DeepMind',
    imageSrc: '/images/graduates/sarah.webp',
  },
  {
    quote: "This course was the first step in my career in AI safety. The BlueDot course allowed me to bridge the gap between my previous career as an economist to now working in the UK Government AI Directorate. The course provided me with a great introduction to the field, and allowed me to meet some great people with whom I am still friends. I'd recommend this course to anyone!",
    name: 'Matthew Bradbury',
    role: 'Senior AI Risk Analyst in the UK Government',
    imageSrc: '/images/graduates/matthew.webp',
  },
];

const CommunitySection = () => {
  return (
    <Section className="community-section">
      <div className="community-section__sub-sections flex flex-col gap-spacing-y">
        <CommunityValuesSection />
        <ProjectsSubSection />
        <TestimonialSection testimonials={testimonials} title="What our graduates say" />
      </div>
    </Section>
  );
};

export default CommunitySection;
