import React from 'react';
import { CardGeneric } from '@bluedot/ui/src/CardGeneric';

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
  ];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-[#0066FF] text-5xl font-bold mb-16">Our team</h1>
        <div className="flex flex-wrap gap-8 justify-center md:justify-start">
          {teamMembers.map((member, index) => (
            <CardGeneric
              key={index}
              imageSrc={member.imageSrc}
              name={member.name}
              role={member.role}
              linkedInUrl={member.linkedInUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
