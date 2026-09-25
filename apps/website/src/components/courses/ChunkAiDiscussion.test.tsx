import {
  act, render, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import {
  createMockChunk,
  createMockExercise,
  createMockResource,
  createMockUnit,
} from '../../__tests__/testUtils';
import ChunkAiDiscussion, { buildDiscussionPrompt } from './ChunkAiDiscussion';
import type { ChunkWithContent } from './UnitLayout';

const unit = createMockUnit({
  courseTitle: 'AGI Strategy',
  title: 'Drivers of AI Progress',
  unitNumber: '2',
});

const chunk: ChunkWithContent = {
  ...createMockChunk({
    chunkTitle: 'What can AI do? Coding & research',
    chunkContent: 'Compare evidence, assumptions & forecasts. What changes at 50% reliability? 🤔',
  }),
  resources: [
    createMockResource({
      resourceName: 'Core evidence',
      resourceLink: 'https://example.com/evidence?metric=time&reliability=50#results',
    }),
    createMockResource({
      id: 'further-resource',
      resourceName: 'Further reading',
      resourceLink: 'https://example.com/further',
      coreFurtherMaybe: 'Further',
    }),
  ],
  exercises: [createMockExercise({ answer: 'The hidden exercise answer' })],
};

describe('ChunkAiDiscussion', () => {
  test('opens the assistant menu with the keyboard and restores focus on Escape', async () => {
    const user = userEvent.setup();
    const { getByRole, findByRole, queryByRole } = render(<ChunkAiDiscussion chunk={chunk} unit={unit} courseSlug="agi-strategy" chunkIndex={2} />);
    const trigger = getByRole('button', { name: 'Ask AI' });

    await act(async () => {
      trigger.focus();
      await user.keyboard('{ArrowDown}');
    });

    const menu = await findByRole('menu', { name: 'Ask AI' });
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));

    await act(async () => {
      await user.keyboard('{Escape}');
    });

    expect(queryByRole('menu')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  test('dismisses the assistant menu when clicking outside it', async () => {
    const user = userEvent.setup();
    const { getByRole, findByRole, queryByRole } = render(<ChunkAiDiscussion chunk={chunk} unit={unit} courseSlug="agi-strategy" chunkIndex={2} />);

    await act(async () => {
      await user.click(getByRole('button', { name: 'Ask AI' }));
    });
    expect(await findByRole('menu', { name: 'Ask AI' })).toBeTruthy();

    await act(async () => {
      await user.click(document.body);
    });

    expect(queryByRole('menu')).toBeNull();
  });

  test.each(['Claude', 'ChatGPT'])('selecting %s uses the same section prompt and closes the menu', async (provider) => {
    const user = userEvent.setup();
    const { getByRole, findByRole, queryByRole } = render(<ChunkAiDiscussion chunk={chunk} unit={unit} courseSlug="agi-strategy" chunkIndex={2} />);
    const providerName = `Talk about this section with ${provider} (opens in a new tab)`;
    const desktopHref = getByRole('link', { name: providerName }).getAttribute('href');

    await act(async () => {
      await user.click(getByRole('button', { name: 'Ask AI' }));
    });

    const menu = await findByRole('menu', { name: 'Ask AI' });
    const providerItem = within(menu).getByRole('menuitem', { name: providerName });
    expect(providerItem.getAttribute('href')).toBe(desktopHref);
    expect(providerItem.getAttribute('target')).toBe('_blank');

    providerItem.addEventListener('click', (event) => event.preventDefault());
    await act(async () => {
      await user.click(providerItem);
    });

    expect(queryByRole('menu')).toBeNull();
  });

  test('opens each provider with the same complete section prompt in its query', () => {
    const { getByRole } = render(<ChunkAiDiscussion chunk={chunk} unit={unit} courseSlug="agi-strategy" chunkIndex={2} />);

    const claudeLink = getByRole('link', { name: /with Claude/ });
    const chatgptLink = getByRole('link', { name: /with ChatGPT/ });
    const claudeUrl = new URL(claudeLink.getAttribute('href')!);
    const chatgptUrl = new URL(chatgptLink.getAttribute('href')!);
    const prompt = claudeUrl.searchParams.get('q');

    expect(claudeUrl.origin + claudeUrl.pathname).toBe('https://claude.ai/new');
    expect(chatgptUrl.origin + chatgptUrl.pathname).toBe('https://chatgpt.com/');
    expect(chatgptUrl.searchParams.get('q')).toBe(prompt);
    expect(prompt).toContain('AGI Strategy, Unit 2: Drivers of AI Progress');
    expect(prompt).toContain(chunk.chunkTitle);
    expect(prompt).toContain('https://bluedot.org/courses/agi-strategy/2/3');
    expect(prompt).toContain(chunk.chunkContent);
    expect(prompt).toContain('Core evidence: https://example.com/evidence?metric=time&reliability=50#results');
    expect(claudeLink.getAttribute('target')).toBe('_blank');
    expect(chatgptLink.getAttribute('target')).toBe('_blank');
  });

  test('includes learning context without disclosing exercise answers', () => {
    const { getByRole } = render(<ChunkAiDiscussion chunk={chunk} unit={unit} courseSlug="agi-strategy" chunkIndex={0} />);

    const prompt = new URL(getByRole('link', { name: /with Claude/ }).getAttribute('href')!).searchParams.get('q');

    expect(prompt).toContain('Core evidence');
    expect(prompt).not.toContain('The hidden exercise answer');
    expect(prompt).not.toContain('Further reading');
    expect(prompt).not.toContain('https://example.com/further');
  });

  test('includes an ordinary full introduction and the Core reading guide', () => {
    const introduction = `${'Compare AI performance across tasks, reliability levels, and time horizons. '.repeat(28)}Final introduction paragraph.`;
    const readingGuide = 'Read the full report, then compare the results for assisted and unassisted work. Identify which measurements support each claim and which limitations remain.';
    const completeChunk = {
      ...chunk,
      chunkContent: introduction,
      resources: [createMockResource({ resourceGuide: readingGuide })],
    };
    const { getByRole } = render(<ChunkAiDiscussion chunk={completeChunk} unit={unit} courseSlug="agi-strategy" chunkIndex={0} />);
    const prompt = new URL(getByRole('link', { name: /with Claude/ }).getAttribute('href')!).searchParams.get('q');

    expect(prompt).toContain(introduction);
    expect(prompt).toContain(readingGuide);
    expect(prompt).not.toContain('The hidden exercise answer');
  });

  test('keeps large Unicode context within the encoded prompt limit for both providers', () => {
    const largeChunk = {
      ...chunk,
      chunkTitle: 'AI progress: 世界 & 🤔?',
      chunkContent: 'Evidence 🤔 世界, uncertainty & progress? '.repeat(2000),
      resources: [createMockResource({ resourceGuide: 'Guide 📚 café: compare & explain. '.repeat(1000) })],
    };
    const props = {
      chunk: largeChunk, unit, courseSlug: 'agi-strategy', chunkIndex: 0,
    };
    const { getByRole } = render(<ChunkAiDiscussion {...props} />);
    const expectedPrompt = buildDiscussionPrompt(props);

    for (const provider of ['Claude', 'ChatGPT']) {
      const url = new URL(getByRole('link', { name: new RegExp(`with ${provider}`) }).getAttribute('href')!);
      const prompt = url.searchParams.get('q')!;

      expect(prompt).toBe(expectedPrompt);
      expect(encodeURIComponent(prompt).length).toBeLessThanOrEqual(14000);
      expect(prompt).toContain('Evidence 🤔 世界, uncertainty & progress?');
      expect(prompt).toContain('Guide 📚 café: compare & explain.');
      expect(prompt).toContain('https://bluedot.org/courses/agi-strategy/2/1');
      expect(prompt).not.toContain('\uFFFD');
      expect(prompt).not.toContain('The hidden exercise answer');
      expect([...url.searchParams.keys()]).toEqual(['q']);
      expect(url.hash).toBe('');
    }
  });

  test('keeps the section link and readings usable when an introduction is long', () => {
    const longChunk = {
      ...chunk,
      chunkContent: 'Long course introduction. '.repeat(1000),
    };
    const { getByRole } = render(<ChunkAiDiscussion chunk={longChunk} unit={unit} courseSlug="agi-strategy" chunkIndex={0} />);

    const prompt = new URL(getByRole('link', { name: /with Claude/ }).getAttribute('href')!).searchParams.get('q');

    expect(prompt).not.toContain(longChunk.chunkContent);
    expect(prompt).toContain('Long course introduction.');
    expect(prompt).toContain('https://bluedot.org/courses/agi-strategy/2/1');
    expect(prompt).toContain('https://example.com/evidence?metric=time&reliability=50#results');
  });
});
