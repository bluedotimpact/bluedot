import { trpc } from '../../utils/trpc';
import AlumniStoryCarousel, { type AlumniStory } from '../lander/components/AlumniStoryCarousel';

const FeaturedAlumniStories = () => {
  const { data } = trpc.testimonials.getCommunityMembers.useQuery();

  const stories: AlumniStory[] = (data ?? [])
    .filter((t) => t.storyUrl)
    .sort((a, b) => Number(!!b.isPrioritised) - Number(!!a.isPrioritised))
    .map((t) => ({
      name: t.name,
      role: t.jobTitle,
      story: t.quote,
      imageSrc: t.imageSrc,
      url: t.url,
      storyUrl: t.storyUrl,
    }));

  if (stories.length === 0) return null;

  return (
    <AlumniStoryCarousel
      stories={stories}
      title="Featured stories"
    />
  );
};

export default FeaturedAlumniStories;
