import { Card, Section } from '@bluedot/ui';

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
    imageSrc: '/images/team/adam.jpg',
    name: 'Adam Jones',
    role: 'AI Safety',
    linkedInUrl: 'https://www.linkedin.com/in/domdomegg/',
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
];

const TeamSection = () => {
  return (
    // TODO use SlideList, currently having problems with images
    <Section className="team" title="Our team">
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
            className="team__card w-[323px]"
            imageClassName="team__card-image h-[300px]"
          />
        ))}
      </div>
    </Section>
  );
};

export default TeamSection;
