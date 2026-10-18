import { SectionHeading, SlideList } from '@bluedot/ui';
import { type Quote } from '../../lander/components/QuoteSection';

export type Testimonial = Quote;

type TestimonialSubSectionProps = {
  testimonials: Testimonial[];
  title?: string;
};
const TestimonialSection = ({
  testimonials,
  title,
}: TestimonialSubSectionProps) => {
  return (
    <div className="testimonial-section pb-spacing-y">
      <SectionHeading title={title} titleLevel="h3" />
      <SlideList
        maxItemsPerSlide={3}
        maxRows={1}
        minItemWidth={300}
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.name} className="testimonial flex flex-col h-full border rounded-lg p-8">
            <blockquote className="mb-space-between flex-grow">
              "{testimonial.quote}"
            </blockquote>
            <div className="flex items-center gap-space-between mt-auto">
              <div className="size-16 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={testimonial.imageSrc}
                  alt={testimonial.name}
                  className="size-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-primary">
                  {testimonial.name}
                </div>
                <div className="text-size-sm text-bluedot-darker">
                  {testimonial.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </SlideList>
    </div>
  );
};

export default TestimonialSection;
