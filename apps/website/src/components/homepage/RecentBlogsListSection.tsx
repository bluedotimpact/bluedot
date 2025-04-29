import {
  ClickTarget, CTALinkOrButton, Section, Tag, ProgressDots,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { H3, P } from '../Text';
import { GetBlogsResponse } from '../../pages/api/cms/blogs';

const RecentBlogsListSection = () => {
  const [{ data, loading, error }] = useAxios<GetBlogsResponse>({
    method: 'get',
    url: '/api/cms/blogs',
  });

  // Get the 3 most recent blogs
  const recentBlogs = data?.blogs?.slice(0, 3) || [];

  return (
    <Section className="blog-section" title="Our blog">
      <div className="blog-section__container flex flex-col mb-6">
        {loading && <ProgressDots />}
        {error && <P>Failed to load blog posts. Please try again later.</P>}
        {recentBlogs.length > 0 ? (
          recentBlogs.map((blog) => (
            <BlogPost
              key={blog.id}
              date={new Date(blog.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              title={blog.title}
              author={blog.authorName}
              url={`/blog/${blog.slug}`}
            />
          ))
        ) : (
          !loading && !error && <P>No blog posts available at the moment.</P>
        )}
      </div>
      <CTALinkOrButton url="/blog" withChevron variant="secondary">
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
    <ClickTarget
      className="blog-section__blog-post-container w-full flex flex-col sm:flex-row items-start align-top justify-between py-6 last:border-b-0 border-b border-color-divider sm:gap-6"
      url={url}
    >
      <P className="blog-section__blog-post-date basis-[16%] uppercase mb-6">{date}</P>
      <div className="blog-section__blog-post-details w-full">
        <H3 className="blog-section__blog-post-title">{title}</H3>
        <div className="blog-section__blog-post-metadata w-full flex flex-col sm:flex-row mt-6 gap-6">
          <P className="blog-section__blog-post-author flex-grow">By {author}</P>
          {tag && <Tag className="blog-section__blog-post-tag self-end">{tag}</Tag>}
        </div>
      </div>
    </ClickTarget>
  );
};

export default RecentBlogsListSection;
