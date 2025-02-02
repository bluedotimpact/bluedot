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
    ctaUrl: '#',
  },
  {
    id: 2,
    title: 'Safety Haven: Justifying and exploring an antitrust safe haven for AI safety research collaboration',
    authorName: 'Ella Duus',
    imageSrc: '/images/project-winners/ella-duus.png',
    ctaUrl: '#',
  },
  {
    id: 3,
    title: 'Societal Adaptation to AI Human-Labor Automation',
    authorName: 'Yuval Rymon',
    imageSrc: '/images/project-winners/yuval-rymon.png',
    ctaUrl: '#',
  },
  {
    id: 4,
    title: 'Are you secretly training AI? Methods for uncovering covert AI training: A framework for feasibility and future research',
    authorName: 'Naci Cankaya',
    imageSrc: '/images/project-winners/naci-cankaya.png',
    ctaUrl: '#',
  },
];

const GovernanceProjects = () => {
  return (
    <section className="governance-projects p-6 container-lined">
      <div className="governance-projects__container mx-auto max-w-[1750px]">
        <div className="governance-projects__header mb-12 flex justify-between">
          <div className="governance-projects__title-container flex flex-col gap-2">
            <h2 className="governance-projects__title text-2xl font-[650] text-bluedot-darker">
              AI Governance Projects
            </h2>
            <p className="governance-projects__featured-label text-xs font-[650] uppercase text-bluedot-black">
              Competition winners
            </p>
          </div>
          <CTALinkOrButton
            className="governance-projects__link h-fit py-3"
            url="#"
            variant="secondary"
            withChevron
          >
            Explore more projects
          </CTALinkOrButton>
        </div>
        <div className="governance-projects__grid grid grid-cols-[repeat(auto-fit,minmax(0,max-content))] gap-4 overflow-visible mb-3">
          {projects.map((project) => (
            <Card
              key={project.title}
              title={project.title}
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
              footerContent={(
                <span className="governance-projects__author text-bluedot-black">
                  by {project.authorName}
                </span>
              )}
              className="governance-projects__project"
              isEntireCardClickable
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GovernanceProjects;
