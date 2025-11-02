import { CTALinkOrButton, ErrorSection, ProgressDots } from '@bluedot/ui';
import { H2, P } from '@bluedot/ui/src/Text';
import Link from 'next/link';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

export type HomepageBlogSectionProps = {
  maxItems?: number | undefined;
};

const HomepageBlogSection = ({ maxItems }: HomepageBlogSectionProps) => {
  const { data: blogs, isLoading: loading, error } = trpc.blogs.getAll.useQuery();

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return (
      <section className="relative bg-white border-b border-[rgba(19,19,46,0.1)] py-12 px-5 min-[680px]:py-16 min-[680px]:px-8 min-[1024px]:py-20 min-[1024px]:px-12 min-[1280px]:py-24 min-[1280px]:px-16 2xl:px-20">
        <div className="relative z-10 max-w-screen-xl mx-auto">
          <div className="flex justify-between items-center mb-12 min-[680px]:mb-16 min-[1024px]:mb-20 min-[1280px]:mb-16">
            {/* Tailwind doesn't support font-feature-settings */}
            <H2
              className="text-[28px] min-[680px]:text-4xl min-[1024px]:text-[40px] min-[1280px]:text-5xl leading-[125%] tracking-[-1px] font-medium text-[#13132E] text-center min-[680px]:text-left w-full min-[680px]:w-auto"
              style={{ fontFeatureSettings: "'ss02' on" }}
            >
              What we&apos;re thinking
            </H2>
          </div>
          <ProgressDots />
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-white border-b border-[rgba(19,19,46,0.1)] py-12 px-5 min-[680px]:py-16 min-[680px]:px-8 min-[1024px]:py-20 min-[1024px]:px-12 min-[1280px]:py-24 min-[1280px]:px-16 2xl:px-20">
      {/* Noise Texture Overlay */}
      {/* Tailwind doesn't support mix-blend-soft-light */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none bg-[url(/images/homepage/noise.svg)] bg-[length:464.64px_736.56px] bg-repeat bg-left-top"
        style={{ mixBlendMode: 'soft-light' }}
      />

      <div className="relative z-10 max-w-screen-xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col min-[680px]:flex-row justify-between items-center gap-4 mb-12 min-[680px]:mb-16 min-[1024px]:mb-20 min-[1280px]:mb-16">
          {/* Tailwind doesn't support font-feature-settings */}
          <H2
            className="text-[28px] min-[680px]:text-4xl min-[1024px]:text-[40px] min-[1280px]:text-5xl leading-[125%] tracking-[-1px] font-medium text-[#13132E] text-center min-[680px]:text-left w-full min-[680px]:w-auto"
            style={{ fontFeatureSettings: "'ss02' on" }}
          >
            What we&apos;re thinking
          </H2>

          <CTALinkOrButton
            url={ROUTES.blog.url}
            className="hidden min-[680px]:flex h-11 px-4 bg-[rgba(19,19,46,0.1)] text-[#13132e] hover:text-[#13132e] text-[15px] font-medium tracking-[-0.3px] leading-[1.6] rounded-md hover:bg-[rgba(19,19,46,0.15)] whitespace-nowrap"
          >
            Read our blog
          </CTALinkOrButton>
        </div>

        {/* Blog List */}
        {blogs?.length === 0 ? (
          <P>No blog posts available at the moment.</P>
        ) : (
          <div className="flex flex-col min-[1025px]:flex-row gap-0 min-[1025px]:gap-12">
            {blogs?.slice(0, maxItems).map((blog, index) => (
              <div key={blog.id} className="flex flex-col min-[1025px]:flex-row min-[1025px]:flex-1">
                <BlogCard blog={blog} />
                {index < (maxItems ? Math.min(maxItems, blogs.length) : blogs.length) - 1 && (
                  <BlogDivider />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mobile CTA Button */}
        <CTALinkOrButton
          url={ROUTES.blog.url}
          className="min-[680px]:hidden mt-12 h-11 px-4 bg-[rgba(19,19,46,0.1)] text-[#13132e] hover:text-[#13132e] text-[15px] font-medium tracking-[-0.3px] leading-[1.6] rounded-md hover:bg-[rgba(19,19,46,0.15)]"
        >
          Read our blog
        </CTALinkOrButton>
      </div>
    </section>
  );
};
export default HomepageBlogSection;

type BlogCardProps = {
  blog: inferRouterOutputs<AppRouter>['blogs']['getAll'][number];
};

const BlogCard = ({ blog }: BlogCardProps) => {
  const url = `/blog/${blog.slug}`;
  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).toUpperCase().replace(',', 'TH,')
    : 'UNKNOWN DATE';

  const authorName = blog.authorName?.toUpperCase() || 'UNKNOWN AUTHOR';

  return (
    <Link href={url} className="flex flex-col gap-6 min-[680px]:gap-4 min-[1024px]:gap-6 rounded-xl group">
      <h3 className="text-[20px] min-[680px]:text-2xl leading-[1.3] tracking-[-0.4px] min-[680px]:tracking-[-0.18px] min-[1920px]:tracking-[-0.48px] text-[#13132e] font-normal group-hover:opacity-70 transition-opacity">
        {blog.title || 'Untitled'}
      </h3>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-size-xs leading-[12px] tracking-[0.75px] uppercase text-[rgba(19,19,46,0.8)] whitespace-nowrap">
          {formattedDate}
        </span>
        <div className="size-1.5 rounded-full bg-[#13132e] shrink-0" />
        <span className="text-size-xs leading-[12px] tracking-[0.75px] uppercase text-[rgba(19,19,46,0.8)] whitespace-nowrap">
          {authorName}
        </span>
      </div>
    </Link>
  );
};

const BlogDivider = () => {
  return (
    <div className="relative h-0 w-full min-[1025px]:h-auto min-[1025px]:w-0 my-8 min-[680px]:my-12 min-[1025px]:my-0 min-[1025px]:mx-6">
      <svg
        className="absolute -inset-y-px inset-x-0 min-[1025px]:inset-y-0 min-[1025px]:-inset-x-px w-full min-[1025px]:w-auto min-[1025px]:h-full"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          className="min-[1025px]:hidden"
          stroke="rgba(19,19,46,0.1)"
          strokeWidth="1"
        />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="100%"
          className="hidden min-[1025px]:block"
          stroke="rgba(19,19,46,0.1)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
