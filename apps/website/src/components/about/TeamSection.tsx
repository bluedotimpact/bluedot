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
    <Section title="Our team" className="team-section !border-b-0">
      <SlideList
        maxItemsPerSlide={4}
        maxRows={3}
        className="team-section__team"
      >
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            imageSrc={member.imageSrc}
            title={member.name}
            subtitle={member.role}
            ctaUrl={member.linkedInUrl}
            ctaText="LinkedIn"
            className="team-section__card"
            imageClassName="team-section__card-image h-[300px] w-[300px]"
          />
        ))}
      </SlideList>
    </Section>
  );
};

export default TeamSection;
