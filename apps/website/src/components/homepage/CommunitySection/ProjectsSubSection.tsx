import {
  Card, CTALinkOrButton, SectionHeading, SlideList,
} from '@bluedot/ui';
import { ROUTES } from '../../../lib/routes';

type Project = {
  id: number;
  title: string;
  authorName: string;
  imageSrc: string;
  ctaUrl: string;
};

const projects: Project[] = [
  {
    id: 1,
    title: 'Contextual Constitutional AI',
    authorName: 'Akshat Naik',
    imageSrc: '/images/project-winners/akshat-naik.webp',
    ctaUrl: `${ROUTES.projects.url}/contextual-constitutional-ai`,
  },
  {
    id: 2,
    title: 'Safety Haven: Justifying and exploring an antitrust safe haven for AI safety research collaboration',
    authorName: 'Ella Duus',
    imageSrc: '/images/project-winners/ella-duus.webp',
    ctaUrl: `${ROUTES.projects.url}/safety-haven-justifying-and-exploring-an-antitrust-safe-haven-for-ai-safety-research-collaboration`,
  },
  {
    id: 3,
    title: 'Societal Adaptation to AI Human-Labor Automation',
    authorName: 'Yuval Rymon',
    imageSrc: '/images/project-winners/yuval-rymon.webp',
    ctaUrl: `${ROUTES.projects.url}/societal-adaptation-to-ai-human-labor-automation`,
  },
  {
    id: 4,
    title: 'Are you secretly training AI? Methods for uncovering covert AI training: A framework for feasibility and future research',
    authorName: 'Naci Cankaya',
    imageSrc: '/images/project-winners/naci-cankaya.webp',
    ctaUrl: `${ROUTES.projects.url}/are-you-secretly-training-ai-methods-for-uncovering-covert-ai-training-a-framework-for-feasibility-and-future-research`,
  },
];

const ProjectsSubSection = () => {
  return (
    <div className="projects p-6 container-lined flex flex-col mb-spacing-y">
      <SectionHeading
        title="Course Projects"
        titleLevel="h3"
        subtitle="Competition winners"
        className="projects__heading"
      />
      <div className="projects__body flex flex-col gap-spacing-y">
        <SlideList maxItemsPerSlide={4} minItemWidth={260} className="projects__projects">
          {projects.map((project) => (
            <Card
              key={project.title}
              title={project.title}
              subtitle={`by ${project.authorName}`}
              subtitleClassName="text-base"
              imageSrc={project.imageSrc}
              ctaUrl={project.ctaUrl}
              className="projects__project"
              isEntireCardClickable
            />
          ))}
        </SlideList>
        <CTALinkOrButton
          className="projects__link h-fit py-3"
          url={ROUTES.projects.url}
          variant="secondary"
          withChevron
        >
          Explore more projects
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default ProjectsSubSection;
