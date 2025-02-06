import { CTALinkOrButton, Section, Tag } from '@bluedot/ui';

const BlogSection = () => {
  return (
    <Section className="blog-section" title="Our work">
      <div className="blog-section__container flex flex-col mb-6">
        <BlogPost
          date="December 12, 2024"
          title="Teach-swap-explain: a learning activity for course designers to create highly effective learning experiences"
          author="Adam Jones"
          url="https://bluedot.org/blog/teach-swap-explain-activity/"
        />
        <BlogPost
          date="December 4, 2024"
          title="Why we run our AI safety courses"
          author="Adam Jones"
          url="https://aisafetyfundamentals.com/blog/why-we-run-our-ai-safety-courses/"
        />
        <BlogPost
          date="October 30, 2024"
          title="AI Alignment June 2024 course retrospective"
          author="Adam Jones"
          url="https://bluedot.org/blog/ai-alignment-june-2024-retro/"
          tag="AI alignment"
        />
      </div>
      <CTALinkOrButton url="https://bluedot.org/blog/" withChevron variant="secondary">
        Read more blog articles
      </CTALinkOrButton>
    </Section>
  );
};

const BlogPost = ({
  date, title, author, url, tag,
}: {
  date: string, title: string, author: string, url: string, tag?: string
}) => {
  return (
    <a
      className="blog-section__blog-post-container w-full flex flex-col sm:flex-row items-start align-top justify-between py-6 border-b border-color-divider"
      href={url}
    >
      <p className="blog-section__blog-post-date basis-[16%] uppercase mb-6">{date}</p>
      <div className="blog-section__blog-post-details w-full">
        <h3 className="blog-section__blog-post-title">{title}</h3>
        <div className="blog-section__blog-post-metadata w-full flex flex-col sm:flex-row mt-6 gap-6">
          <p className="blog-section__blog-post-author flex-grow">By {author}</p>
          {tag && <Tag className="blog-section__blog-post-tag sm:self-end">{tag}</Tag>}
        </div>
      </div>
    </a>
  );
};

export default BlogSection;
