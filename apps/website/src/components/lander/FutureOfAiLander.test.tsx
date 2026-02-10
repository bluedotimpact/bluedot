import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import FutureOfAiLander from './FutureOfAiLander';
import { createMockCourse, createMockUnit } from '../../__tests__/testUtils';

const mockUnits = [
  createMockUnit({
    title: 'Basic Principles of Fish',
    content: '## Welcome to the deep end! \nThis unit explores the core concepts that _every_ fish enthusiast needs to understand, from basic anatomy to the physics of water movement.\nWe\'ll explore how fish \n[ ] communicate,\n[ ] navigate,\n[ ] and survive in their watery world\n...with special attention to the unique adaptations that make each species special.\nThrough hands-on exercises and detailed study materials, you\'ll develop a strong foundation in **_[ichthyology](https://en.wikipedia.org/wiki/Ichthyology)_** (that\'s fish science for those who don\'t speak fluent marine biologist).\n',
    unitNumber: '1',
  }),
  createMockUnit({
    title: 'What Fish Are People Catching, and Why?',
    content: 'Ever wondered why some fishermen chase tuna while others pursue cod? This unit dives into the complex world of modern fishing practices, from traditional line-fishing to industrial-scale operations. We\'ll examine the technological innovations driving the industry, the economic forces at play, and the eternal question of why that one weird fish at the bottom of the ocean looks like that. Through case studies and practical examples, you\'ll understand the delicate balance between feeding humanity and keeping our oceans stocked with sufficiently sassy fish.\n',
    unitNumber: '2',
  }),
  createMockUnit({
    title: 'The Promise of Fish',
    content: 'Fish: they\'re not just for dinner anymore. This unit explores the untapped potential of our scaly friends in solving global challenges. From fish-powered renewable energy to underwater real estate development, we\'ll examine how piscine innovations are reshaping our world. We\'ll also delve into fish-based social networks (Fishbook), fish-inspired fashion trends, and why salmon make excellent financial advisors. Special attention will be paid to the emerging field of fish-human diplomacy.\n',
    unitNumber: '3',
  }),
  createMockUnit({
    title: 'The Risks of Fish',
    content: 'Not all that glitters is goldfish. This unit examines the darker side of piscine potential, from the threat of fish becoming too self-aware to the risks of sharks learning to use smartphones. Through careful analysis and possibly paranoid speculation, we\'ll prepare for worst-case scenarios like fish developing opposable fins or deciding to implement their own cryptocurrency. Includes emergency protocols for dealing with fish uprising scenarios.\n',
    unitNumber: '4',
  }),
  createMockUnit({
    title: 'Contributing to Fish Safety',
    content: '### The future of fish-human relations depends on you! \nThis capstone unit brings together everything we\'ve learned about our aquatic [overlords-in-waiting](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBWqLpd7QgEtYIur4g48rq8PhAApbpOuO2fwoRB1aPvZpijMnS) and channels it into practical action. \nWe\'ll explore how to make the world a safer place for fish while maintaining appropriate species boundaries. \nThrough \n- case studies,\n- hands-on projects,\n- and possibly underwater meditation sessions,\n\nyou\'ll learn to bridge the gap between gill and lung breathers. \n\n> Warning: May cause increased empathy for tuna sandwiches.\n',
    unitNumber: '5',
  }),
];

const mockCourse = createMockCourse({
  title: 'Future of AI',
});

const courseData = {
  course: mockCourse,
  units: mockUnits,
};

describe('FutureOfAiLander', () => {
  test('renders as expected', () => {
    const { container } = render(<FutureOfAiLander courseData={courseData} />);
    expect(container).toMatchSnapshot();
  });
});
