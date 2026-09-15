import type { Meta, StoryObj } from '@storybook/react';
import TeamSection from './TeamSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const members = [
  {
    name: 'Alex Groth',
    jobTitle: 'Head of Growth',
    subteam: 'Growth',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recaLKjRmOAabcq44/1',
    url: 'https://www.linkedin.com/in/alex-groth/',
  },
  {
    name: 'Ben Lukszys',
    jobTitle: 'Program Lead, Entrepreneur Incubation',
    subteam: 'Talent Activation',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recNwcDAlVmAkhOmh/1',
    url: 'https://www.linkedin.com/in/ben-lukszys/',
  },
  {
    name: 'Bilal Chughtai',
    jobTitle: 'Program Lead',
    subteam: 'Talent Activation',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recMd0FgXTjqRPJMX/1',
    url: 'https://bilalchughtai.co.uk/',
  },
  {
    name: 'Chris Strahle',
    jobTitle: 'Biosecurity Specialist',
    subteam: 'Courses',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recme5eSWMYKVeFvp/1',
    url: 'https://www.linkedin.com/in/christopher-strahle/',
  },
  {
    name: 'Cosima Axford',
    jobTitle: 'People Ops',
    subteam: 'Operations',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/reccmhWDK3CaM9dGY/1',
    url: 'https://www.linkedin.com/in/cosima-axford-96a098206/',
  },
  {
    name: 'Dewi Erwan',
    jobTitle: 'CEO',
    subteam: 'Leadership',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recQG8hIJYxIYghB0/1',
    url: 'https://www.dewierwan.com/',
  },
  {
    name: 'Eleni Kougioumtzi',
    jobTitle: 'Course Systems Engineer',
    subteam: 'Courses',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recSiyDmvwolcBUcT/1',
    url: 'https://www.linkedin.com/in/eleni-kougioumtzi/',
  },
  {
    name: 'Harry Waterman',
    jobTitle: 'Special Projects',
    subteam: 'Special Projects',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recD0ncO1NI8nKWSO/1',
    url: 'https://harrywaterman.com/',
  },
  {
    name: 'Joshua Landes',
    jobTitle: 'Head of Special Projects',
    subteam: 'Special Projects',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recvR1OJPD06Trzhm/1',
    url: 'https://www.linkedin.com/in/josh-landes12/',
  },
  {
    name: 'Li-Lian Ang',
    jobTitle: 'Head of Courses',
    subteam: 'Courses',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recdiantVnGFSn6uf/1',
    url: 'https://anglilian.com/',
  },
  {
    name: 'Lucas Duarte',
    jobTitle: 'Head of Operations',
    subteam: 'Operations',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recqr8CZ2cBlCP0cw/1',
    url: 'https://www.linkedin.com/in/lucas-duarte-nunes/',
  },
  {
    name: 'Olivia Scharfman',
    jobTitle: 'Talent Investor, Biosecurity',
    subteam: 'Talent Activation',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recEjj7paVgfh3GDF/1',
    url: 'https://www.linkedin.com/in/oliviascharfman/',
  },
  {
    name: 'Sam Dower',
    jobTitle: 'Technical AI Safety Specialist',
    subteam: 'Courses',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/rec6oBctscwfhJ7e0/1',
    url: 'https://www.linkedin.com/in/samuel-dower/',
  },
  {
    name: 'Tejas Subramaniam',
    jobTitle: 'Field Strategist',
    subteam: 'Talent Activation',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/reczzXdrsAPrfHyL0/1',
    url: 'https://www.linkedin.com/in/tejassubramaniam/',
  },
  {
    name: 'Weronika Żurek',
    jobTitle: 'Operations & Community Manager',
    subteam: 'Courses',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recmik70iu0IhLEOv/1',
    url: 'https://www.linkedin.com/in/weronika-%C5%BCurek%F0%9F%94%B8-9a395526b/?skipRedirect=true',
  },
  {
    name: 'Will Saunter',
    jobTitle: 'Co-Founder',
    subteam: 'Hiring',
    imageUrl: 'https://web.miniextensions.com/api/public-attachments/91TQ1Gmwjz0wqqiMHkXX/recsgJIyBgrYHdN1m/1',
    url: 'https://www.linkedin.com/in/will-saunter',
  },
];

const meta: Meta<typeof TeamSection> = {
  title: 'Website/About/TeamSection',
  component: TeamSection,
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [trpcStorybookMsw.teamMembers.getAll.query(() => members)] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unassigned: Story = {
  parameters: {
    msw: { handlers: [trpcStorybookMsw.teamMembers.getAll.query(() => members.map((member) => ({ ...member, subteam: undefined })))] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [trpcStorybookMsw.teamMembers.getAll.query(() => [])] },
  },
};
