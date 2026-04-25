import TestimonialCarousel from '../lander/TestimonialCarousel';
import { trpc } from '../../utils/trpc';

const GranteesSection = () => {
  const { data: grantees } = trpc.grants.getAllPublicCareerTransitionGrantees.useQuery();

  const granteeTestimonials = grantees
    ?.filter((g) => g.imageUrl)
    .map((g) => ({
      name: g.granteeName,
      jobTitle: g.bio ?? '',
      quote: g.grantPlan ?? '',
      imageSrc: g.imageUrl!,
      url: g.profileUrl,
    })) ?? [];

  if (granteeTestimonials.length === 0) return null;

  return (
    <TestimonialCarousel
      testimonials={granteeTestimonials}
      title="Our grantees"
      variant="lander"
    />
  );
};

export default GranteesSection;
