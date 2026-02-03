// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, Section, SlideList } from '@bluedot/ui';

const teamMembers = [
  {
    imageSrc: '/images/team/dewi.jpg',
    name: 'Dewi Erwan',
    role: 'Co-founder & CEO',
    linkedInUrl: 'https://www.linkedin.com/in/dewierwan/',
  },
  {
    imageSrc: '/images/team/will.jpg',
    name: 'Will Saunter',
    role: 'Co-founder',
    linkedInUrl: 'https://linkedin.com/in/will-saunter',
  },
  {
    imageSrc: '/images/team/lilian.jpg',
    name: 'Li-Lian Ang',
    role: 'Product & Placements',
    linkedInUrl: 'https://linkedin.com/in/anglilian',
  },
  {
    imageSrc: '/images/team/josh_v2.webp',
    name: 'Josh Landes',
    role: 'Special Projects',
    linkedInUrl: 'https://linkedin.com/in/josh-landes12',
  },
  {
    imageSrc: '/images/team/aniket.png',
    name: 'Aniket Chakravorty',
    role: 'AI Strategy Specialist',
    linkedInUrl: 'https://www.linkedin.com/in/aniket-chakravorty-724458256/',
  },
  {
    imageSrc: '/images/team/samdower.png',
    name: 'Sam Dower',
    role: 'Technical AI Safety Specialist',
    linkedInUrl: 'https://www.linkedin.com/in/samuel-dower/',
  },
  {
    imageSrc: '/images/team/jonahweinbaum.jpg',
    name: 'Jonah Weinbaum',
    role: 'def/acc',
    linkedInUrl: 'https://www.linkedin.com/in/weinbaumjonah/',
  },
];

const TeamSection = () => {
  return (
    <Section title="Our team" className="team-section !border-b-0">
      <SlideList
        maxItemsPerSlide={4}
        maxRows={3}
        className="team-section__team"
      >
        {teamMembers.map((member) => (
          <div key={member.name} className="team-section__card">
            <div className="card flex items-start flex-col transition-transform duration-200">
              <div className="card__image-container w-full">
                <a
                  href={member.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
                >
                  <img
                    className="team-section__card-image size-[300px] object-cover"
                    src={member.imageSrc}
                    alt={`${member.name} - ${member.role}`}
                  />
                </a>
              </div>
              <div className="card__content w-full p-4">
                <h3 className="card__title font-bold text-size-lg mb-1">{member.name}</h3>
                <p className="card__subtitle text-gray-600">{member.role}</p>
              </div>
            </div>
          </div>
        ))}
      </SlideList>
    </Section>
  );
};

export default TeamSection;
