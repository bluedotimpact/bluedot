import { type Quote, SectionHeading, SlideList } from '@bluedot/ui';

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
      <SectionHeading title={title} titleLevel="h3" className="testimonial-section__heading" />
      <SlideList
        maxItemsPerSlide={3}
        maxRows={1}
        minItemWidth={300}
        className="testimonial-section__testimonials"
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.name} className="testimonial flex flex-col h-full border rounded-lg p-8">
            <blockquote className="testimonial__quote mb-space-between flex-grow">
              "{testimonial.quote}"
            </blockquote>
            <div className="testimonial__footer flex items-center gap-space-between mt-auto">
              <div className="testimonial__avatar size-16 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={testimonial.imageSrc}
                  alt={testimonial.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="testimonial__info">
                <div className="testimonial__name font-semibold text-bluedot-black">
                  {testimonial.name}
                </div>
                <div className="testimonial__role text-size-sm text-bluedot-darker">
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
