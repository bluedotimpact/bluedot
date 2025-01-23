import React from 'react';
import { Card, Section } from '@bluedot/ui';

const TeamSection = () => {
  const teamMembers = [
    {
      imageSrc: '/images/team/adam.jpg',
      name: 'Adam Jones',
      role: 'AI Safety',
      linkedInUrl: 'https://linkedin.com/in/adam',
    },
    {
      imageSrc: '/images/team/dewi.jpg',
      name: 'Dewi Erwan',
      role: 'CEO',
      linkedInUrl: 'https://linkedin.com/in/dewi',
    },
    {
      imageSrc: '/images/team/lilian.jpg',
      name: 'Li-Lian Ang',
      role: 'Product',
      linkedInUrl: 'https://linkedin.com/in/li-lian',
    },
    {
      imageSrc: '/images/team/luke.jpg',
      name: 'Luke Drago',
      role: 'AI Governance',
      linkedInUrl: 'https://linkedin.com/in/luke',
    },
    {
      imageSrc: '/images/team/tarin.jpg',
      name: 'Tarin Rickett',
      role: 'Engineering',
      linkedInUrl: 'https://linkedin.com/in/tarin',
    },
  ];

  return (
    <Section title="Our team">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-[1400px] mx-auto">
        {teamMembers.map((member) => (
          <Card
            key={member.name}
            imageSrc={member.imageSrc}
            title={member.name}
            subtitle={member.role}
            ctaUrl={member.linkedInUrl}
            className="w-full"
          />
        ))}
      </div>
    </Section>
  );
};

export default TeamSection;
