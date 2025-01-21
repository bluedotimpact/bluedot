import Image from "next/image";
import { TinaMarkdown, TinaMarkdownContent } from "tinacms/dist/rich-text";
import { MoreHorizontal, Share2, Clock } from "lucide-react";
import { useMDXComponents } from "./mdx-components";
import Link from "next/link";

interface BlogPost {
  title: string;
  author: { name: string; title: string; avatar: string };
  date: string;
  mainImage: string;
  excerpt: string;
  category: string;
  readTime: number;
  body: any; // TinaMarkdown content
  _sys: { relativePath: string };
}

interface BlogDetailProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogDetail({ post, relatedPosts }: BlogDetailProps) {
  const components = useMDXComponents({});
  console.log("post", post);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <article className="max-w-7xl mx-auto px-4 py-8 mt-24">
      <div className="max-w-3xl mx-auto">
        {/* Title Section */}
        <h1 className="text-4xl md:text-5xl font-serif text-center mb-6">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-12">
          <span>{formatDate(post.date)}</span>
          <span>•</span>
          <span>{post.readTime} min read</span>
          <span>•</span>
          <span>{post.category}</span>
        </div>

        {/* Author and Stats Section */}
        <div className="flex items-center justify-between mb-8 p-4 rounded-full border">
          <div className="flex items-center gap-3">
            <img
              className="w-10 h-10 rounded-full"
              src={post.author?.avatar}
              alt="Rounded avatar"
            />
            <span className="font-medium">{post.author?.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-muted-foreground">{post.readTime}</span>
            </div>
            <Share2 className="h-4 w-4" />
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>

        {/* Main Image */}
        {post.mainImage && (
          <div className="mb-8">
            <div className="aspect-[16/9] bg-blue-100 rounded-lg overflow-hidden">
              <Image
                src={post.mainImage || "/placeholder.svg"}
                alt={post.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <TinaMarkdown content={post.body} components={components} />
        </div>
        {/* Author and Stats Section */}
        <div className="flex items-center justify-between my-8 px-4 py-7 rounded-full border">
          <div className="flex items-center gap-3">
            <img
              className="w-10 h-10 rounded-full"
              src={post.author?.avatar}
              alt="Rounded avatar"
            />
            <span className="font-medium">{post.author?.name}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-muted-foreground">{post.readTime}</span>
            </div>
            <Share2 className="h-4 w-4" />
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Keep Reading Section */}
      {relatedPosts.length > 0 && (
        <div className="mt-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold text-blue-600">Keep reading</h2>
            <div className="h-px flex-1 bg-blue-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="p-0">
                  <div className="p-4">
                    <span className="text-xs font-semibold text-gray-600">
                      {relatedPost.category}
                    </span>
                  </div>
                  {relatedPost.mainImage && (
                    <div className="aspect-[16/9] bg-blue-100">
                      <Image
                        src={relatedPost.mainImage || "/placeholder.svg"}
                        alt={relatedPost.title}
                        width={600}
                        height={338}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col">
                    <Link href={`${relatedPost._sys.relativePath?.split(".md")[0]}`} className="text-xl font-semibold text-blue-600 mb-2">
                      {relatedPost.title}
                    </Link>
                    <time className="text-sm text-gray-600">
                      {formatDate(relatedPost.date)}
                    </time>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}