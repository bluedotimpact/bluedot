import { Quote, SectionHeading } from '@bluedot/ui';

export type Testimonial = Quote;

type TestimonialSubSectionProps = {
  testimonials: Testimonial[],
  title?: string,
};

// Testimonial Card Component
const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="testimonial flex flex-col h-full border border-[#E7E5E4] rounded-lg p-8 bg-white gap-6">
    <blockquote className="testimonial__quote flex-grow text-size-sm leading-[1.6] text-[#13132E] opacity-80">
      "{testimonial.quote}"
    </blockquote>
    <div className="testimonial__footer flex items-center gap-4">
      <div className="testimonial__avatar size-12 rounded-full overflow-hidden flex-shrink-0">
        <img
          src={testimonial.imageSrc}
          alt={testimonial.name}
          className="size-full object-cover"
        />
      </div>
      <div className="testimonial__info flex flex-col">
        <div className="testimonial__name font-semibold text-size-sm leading-normal text-[#13132E]">
          {testimonial.name}
        </div>
        <div className="testimonial__role text-size-xs leading-[20px] text-[#13132E] opacity-80">
          {testimonial.role}
        </div>
      </div>
    </div>
  </div>
);

const AgiStrategyTestimonialSubSection = ({
  testimonials,
  title,
}: TestimonialSubSectionProps) => {
  return (
    <div className="testimonial-section w-full" data-testid="testimonial-section">
      {title && <SectionHeading title={title} titleLevel="h3" className="testimonial-section__heading" />}

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
};

export default AgiStrategyTestimonialSubSection;
