import { Card, Section } from '@bluedot/ui';

const teamMembers = [
  {
    imageSrc: '/images/team/adam.jpg',
    name: 'Adam Jones',
    role: 'AI Safety',
    linkedInUrl: 'https://www.linkedin.com/in/domdomegg/',
  },
  {
    imageSrc: '/images/team/dewi.jpg',
    name: 'Dewi Erwan',
    role: 'CEO',
    linkedInUrl: 'https://www.linkedin.com/in/dewierwan/',
  },
  {
    imageSrc: '/images/team/josh.jpg',
    name: 'Josh Landes',
    role: 'Community Manager',
    linkedInUrl: 'https://linkedin.com/in/josh-landes12',
  },
  {
    imageSrc: '/images/team/lilian.jpg',
    name: 'Li-Lian Ang',
    role: 'Product',
    linkedInUrl: 'https://linkedin.com/in/anglilian',
  },
  {
    imageSrc: '/images/team/tarin.jpg',
    name: 'Tarin Rickett',
    role: 'Engineering',
    linkedInUrl: 'https://linkedin.com/in/tarinrickett/',
  },
  {
    imageSrc: '/images/team/vio.jpg',
    name: 'Viorica Gheorghita',
    role: 'Product',
    linkedInUrl: 'https://www.linkedin.com/in/vioricagheorghita/',
  },
  {
    imageSrc: '/images/team/will.jpg',
    name: 'Will Saunter',
    role: 'Co-founder',
    linkedInUrl: 'https://linkedin.com/in/will-saunter',
  },
];

const TeamSection = () => {
  return (
    <Section className="team" title="Our team">
      <div className="team__grid flex flex-row flex-wrap mt-16 gap-4 max-w-[1400px] mx-auto">
        {/* TODO: 01/27 Migrate this max-w-[1400px] check to Section definition or global.css when we hear back from UX  */}
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            imageSrc={member.imageSrc}
            title={member.name}
            subtitle={member.role}
            ctaUrl={member.linkedInUrl}
            className="team__card"
            imageClassName="team__card-image"
          />
        ))}
      </div>
    </Section>
  );
};

export default TeamSection;
