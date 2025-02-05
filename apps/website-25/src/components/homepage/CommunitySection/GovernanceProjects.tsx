import { Card, CTALinkOrButton } from '@bluedot/ui';

interface Project {
  id: number;
  title: string;
  authorName: string;
  imageSrc: string;
  ctaUrl: string;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'Contextual Constitutional AI',
    authorName: 'Akshat Naik',
    imageSrc: '/images/project-winners/akshat-naik.png',
    ctaUrl: 'https://aisafetyfundamentals.com/projects/contextual-constitutional-ai/',
  },
  {
    id: 2,
    title: 'Safety Haven: Justifying and exploring an antitrust safe haven for AI safety research collaboration',
    authorName: 'Ella Duus',
    imageSrc: '/images/project-winners/ella-duus.png',
    ctaUrl: 'https://aisafetyfundamentals.com/projects/safety-haven-justifying-and-exploring-an-antitrust-safe-haven-for-ai-safety-research-collaboration/',
  },
  {
    id: 3,
    title: 'Societal Adaptation to AI Human-Labor Automation',
    authorName: 'Yuval Rymon',
    imageSrc: '/images/project-winners/yuval-rymon.png',
    ctaUrl: 'https://aisafetyfundamentals.com/projects/societal-adaptation-to-ai-human-labor-automation/',
  },
  {
    id: 4,
    title: 'Are you secretly training AI? Methods for uncovering covert AI training: A framework for feasibility and future research',
    authorName: 'Naci Cankaya',
    imageSrc: '/images/project-winners/naci-cankaya.png',
    ctaUrl: 'https://aisafetyfundamentals.com/projects/are-you-secretly-training-ai-methods-for-uncovering-covert-ai-training-a-framework-for-feasibility-and-future-research/',
  },
];

const GovernanceProjects = () => {
  return (
    <section className="governance-projects p-6 container-lined">
      <div className="governance-projects__container mx-auto max-w-[1750px] flex flex-col gap-12">
        <div className="governance-projects__title-container flex flex-col gap-2">
          <h3 className="governance-projects__title">
            AI Governance Projects
          </h3>
          <p className="governance-projects__featured-label text-xs font-[650] uppercase text-bluedot-black">
            Competition winners
          </p>
        </div>
        <div className="governance-projects__grid grid grid-cols-[repeat(auto-fit,minmax(300px,max-content))] gap-4 overflow-visible mb-3">
          {projects.map((project) => (
            <Card
              key={project.title}
              title={project.title}
              subtitle={`by ${project.authorName}`}
              subtitleClassName="text-base"
              ctaUrl={project.ctaUrl}
              imageNode={(
                <div className="governance-projects__image-container relative">
                  <img
                    className="governance-projects__image w-full max-h-full object-cover rounded-2xl"
                    src={project.imageSrc}
                    alt={project.title}
                  />
                  <div className="governance-projects__badge absolute flex items-center gap-1 text-sm font-[650] top-2 left-2 text-bluedot-black bg-cream-normal rounded-lg px-3 py-2">
                    <img
                      src="/icons/star_gold.svg"
                      alt="★"
                      className="governance-projects__star-icon size-[12px]"
                    />{' '}1st Place
                  </div>
                </div>
              )}
              className="governance-projects__project"
              isEntireCardClickable
              isExternalUrl
            />
          ))}
        </div>
        <CTALinkOrButton
          className="governance-projects__link h-fit py-3"
          url="https://aisafetyfundamentals.com/projects/"
          variant="secondary"
          isExternalUrl
          withChevron
        >
          Explore more projects
        </CTALinkOrButton>
      </div>
    </section>
  );
};

export default GovernanceProjects;
