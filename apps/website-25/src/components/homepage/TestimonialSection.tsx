import Image from 'next/image';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "This was the most positively impactful course I've ever taken (unless you count the high school class in which I got to know my husband!), as it gave me the background to engage with the AI safety and governance communities. I don't know how I would have gotten up to speed otherwise, and it opened the door to pretty much everything I've done professionally for the past couple years.",
    name: "Kendrea Beers",
    role: "Horizon Junior Fellow at the Center for Security and Emerging Technology",
    image: "/images/graduates/kendrea.png"
  },
  {
    quote: "I participated in the AISF Alignment Course last year and consider it to be the single most useful step I've taken in my career so far. I cannot recommend the program strongly enough",
    name: "Sarah Cogan",
    role: "Software Engineer at Google DeepMind",
    image: "/images/graduates/sarah.png"
  },
  {
    quote: "This course was the first step in my career in AI safety. The BlueDot course allowed me to bridge the gap between my previous career as an economist to now working in the UK Government AI Directorate. The course provided me with a great introduction to the field, and allowed me to meet some great people with whom I am still friends. I'd recommend this course to anyone!",
    name: "Matthew Bradbury",
    role: "Senior AI Risk Analyst in the UK Government",
    image: "/images/graduates/matthew.png"
  }
];

const TestimonialSection = () => {
  return (
    <section className="testimonial-section py-24">
      <div className="testimonial-section__container container-lined mx-auto max-w-[1750px]">
        <h2 className="testimonial-section__title text-2xl font-bold text-bluedot-darker mb-12 px-6 pt-6">
          What our graduates say
        </h2>
        
        <div className="testimonial-section__grid grid grid-cols-1 md:grid-cols-3 gap-[30px] divide-x divide-gray-200 px-[46px] pb-[78px] text-black">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-section__card flex flex-col px-8 first:pl-0 last:pr-0">
              <blockquote className="testimonial-section__quote text-lg mb-6 line-clamp-[8]">
                "{testimonial.quote}"
              </blockquote>
              <div className="testimonial-section__profile flex items-center gap-4 mt-auto">
                <div className="testimonial-section__image-wrapper w-16 h-16 relative rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="testimonial-section__image object-cover"
                  />
                </div>
                <div className="testimonial-section__profile-info">
                  <div className="testimonial-section__name font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="testimonial-section__role text-black">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;

