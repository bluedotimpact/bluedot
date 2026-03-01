import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { createMockChunk, createMockUnit } from '../../__tests__/testUtils';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import SideBar from './SideBar';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';

const COURSE_UNITS = [
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

const CHUNKS = [
  createMockChunk({
    chunkTitle: 'What can AI do today?',
    chunkContent: 'Five years ago, AI systems struggled to form coherent sentences. Today, >5% of the world use AI products like ChatGPT every week for help with work, studies, and creative projects. These systems extend far beyond a simple chat. They can produce art, write complex code, and control robots to do real-world tasks. \n\nThis unit explores how AI is evolving from simple "tools" into autonomous "agents",  capable of setting goals, making complex plans, and acting in the real world.\n',
  }),
];

// Create allUnitChunks from COURSE_UNITS - each unit gets the CHUNKS mapped to BasicChunk format
const ALL_UNIT_CHUNKS: Record<string, BasicChunk[]> = {};
COURSE_UNITS.forEach((unit) => {
  ALL_UNIT_CHUNKS[unit.id] = CHUNKS.map((chunk) => ({
    id: chunk.id,
    chunkTitle: chunk.chunkTitle,
    chunkOrder: chunk.chunkOrder,
    estimatedTime: chunk.estimatedTime,
  }));
});

describe('SideBar', () => {
  const defaultProps = {
    unitChunks: ALL_UNIT_CHUNKS,
    courseTitle: 'What the fish [Test Course]',
    courseSlug: 'test-course',
    units: COURSE_UNITS,
    currentUnitNumber: 1,
    currentChunkIndex: 0,
    onChunkSelect: vi.fn(),
  };

  test('renders default as expected', () => {
    const { container } = render(
      <SideBar {...defaultProps} />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  test('shows Apply CTA with deadline when upcoming round exists', () => {
    const { getByRole } = render(
      <SideBar
        {...defaultProps}
        applyCTAProps={{
          applicationDeadline: '31 Jan',
          applicationUrl: 'https://example.com/apply',
          hasApplied: false,
        }}
      />,
      { wrapper: TrpcProvider },
    );

    const button = getByRole('link', { name: 'Apply by 31 Jan' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', 'https://example.com/apply');
  });

  test('does not show Apply CTA when user has already applied', () => {
    const { queryByRole } = render(
      <SideBar
        {...defaultProps}
        applyCTAProps={{
          applicationDeadline: '31 Jan',
          applicationUrl: 'https://example.com/apply',
          hasApplied: true,
        }}
      />,
      { wrapper: TrpcProvider },
    );

    expect(queryByRole('link', { name: /apply/i })).not.toBeInTheDocument();
  });
});
