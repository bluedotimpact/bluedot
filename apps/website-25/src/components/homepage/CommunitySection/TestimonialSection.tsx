import { Section } from '@bluedot/ui';
import { SlideList } from '@bluedot/ui/src/SlideList';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  imageSrc: string;
};

const testimonials: Testimonial[] = [
  {
    quote: "This was the most positively impactful course I've ever taken (unless you count the high school class in which I got to know my husband!), as it gave me the background to engage with the AI safety and governance communities. I don't know how I would have gotten up to speed otherwise, and it opened the door to pretty much everything I've done professionally for the past couple years.",
    name: 'Kendrea Beers',
    role: 'Horizon Junior Fellow at the Center for Security and Emerging Technology',
    imageSrc: '/images/graduates/kendrea.png',
  },
  {
    quote: "I participated in the AISF Alignment Course last year and consider it to be the single most useful step I've taken in my career so far. I cannot recommend the program strongly enough",
    name: 'Sarah Cogan',
    role: 'Software Engineer at Google DeepMind',
    imageSrc: '/images/graduates/sarah.png',
  },
  {
    quote: "This course was the first step in my career in AI safety. The BlueDot course allowed me to bridge the gap between my previous career as an economist to now working in the UK Government AI Directorate. The course provided me with a great introduction to the field, and allowed me to meet some great people with whom I am still friends. I'd recommend this course to anyone!",
    name: 'Matthew Bradbury',
    role: 'Senior AI Risk Analyst in the UK Government',
    imageSrc: '/images/graduates/matthew.png',
  },
];

const TestimonialSection = () => {
  return (
    <Section>
      <SlideList
        subtitle="What our graduates say"
        maxItemsPerSlide={3}
        slideClassName="px-2"
        containerClassName="justify-center"
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.name} className="testimonial flex flex-col h-full border rounded-radius-md p-8">
            <blockquote className="testimonial__quote text-size-l text-bluedot-darker mb-8 flex-grow text-center">
              "{testimonial.quote}"
            </blockquote>
            <div className="testimonial__footer flex items-center gap-4 mt-auto">
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
                <div className="testimonial__role text-size-s text-bluedot-darker">
                  {testimonial.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </SlideList>
    </Section>
  );
};

export default TestimonialSection;
