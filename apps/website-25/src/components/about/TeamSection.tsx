import { isMobile } from 'react-device-detect';
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
    role: 'Product',
    linkedInUrl: 'https://linkedin.com/in/anglilian',
  },
  {
    imageSrc: '/images/team/vio.jpg',
    name: 'Viorica Gheorghita',
    role: 'Product',
    linkedInUrl: 'https://www.linkedin.com/in/vioricagheorghita/',
  },
  {
    imageSrc: '/images/team/adam.jpg',
    name: 'Adam Jones',
    role: 'AI Safety',
    linkedInUrl: 'https://www.linkedin.com/in/domdomegg/',
  },
  {
    imageSrc: '/images/team/josh_v2.jpeg',
    name: 'Josh Landes',
    role: 'Community Manager',
    linkedInUrl: 'https://linkedin.com/in/josh-landes12',
  },
  {
    imageSrc: '/images/team/tarin.jpg',
    name: 'Tarin Rickett',
    role: 'Engineering',
    linkedInUrl: 'https://linkedin.com/in/tarinrickett/',
  },
];

const TeamSection = () => {
  return (
    isMobile ? (
      <SlideList
        title="Our team"
        maxItemsPerSlide={5}
        className="team-section team-section--mobile section-body !border-b-0"
      >
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            imageSrc={member.imageSrc}
            title={member.name}
            subtitle={member.role}
            ctaUrl={member.linkedInUrl}
            ctaText="LinkedIn"
            isExternalUrl
            className="team-section__card"
            imageClassName="team-section__card-image h-[300px] w-[300px]"
          />
        ))}
      </SlideList>
    ) : (
      <Section className="team-section team-section--desktop !border-b-0" title="Our team">
        <div className="team__grid flex flex-row flex-wrap mx-auto gap-x-space-between gap-y-12">
          {teamMembers.map((member) => (
            <Card
              key={member.name}
              imageSrc={member.imageSrc}
              title={member.name}
              subtitle={member.role}
              ctaUrl={member.linkedInUrl}
              ctaText="LinkedIn"
              isExternalUrl
              className="team-section__card"
              imageClassName="team-section__card-image h-[300px] w-[300px]"
            />
          ))}
        </div>
      </Section>
    )
  );
};

export default TeamSection;
