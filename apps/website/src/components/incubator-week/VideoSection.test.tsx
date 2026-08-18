import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import VideoSection from './VideoSection';

describe('VideoSection', () => {
  test('embeds the Incubator Week video with an accessible title', () => {
    const markup = renderToStaticMarkup(<VideoSection />);

    expect(markup).toContain('title="Can You Build an AI Safety Startup in Five Days?"');
    expect(markup).toContain('src="https://www.youtube-nocookie.com/embed/C3yDinK0ic0?rel=0"');
  });
});
