import { useTina } from "tinacms/dist/react";
import client from "../../../tina/__generated__/client";
import BlogDetail from "../../components/blog-details";

export default function Home(props: { query: any; variables: any; data: any }) {
  // data passes though in production mode and data is updated to the sidebar data in edit-mode
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });
  const relatedPosts =
    data.postConnection.edges
      ?.filter(
        (edge: any) => edge.node._sys.filename !== props.variables.relativePath
      )
      .slice(0, 3)
      .map((edge: any) => edge.node) || [];

  return <BlogDetail relatedPosts={relatedPosts} post={data.post} />;
}

export const getStaticPaths = async () => {
  const { data } = await client.queries.postConnection();
  const paths = data?.postConnection?.edges?.map((x) => {
    return { params: { slug: x?.node?._sys.filename } };
  });

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps = async (ctx: {params: { slug: string }}) => {
  const { data, query, variables } = await client.queries.post({
    relativePath: ctx.params.slug + ".md",
  });
  const postsResponse = await client.queries.postConnection();
  return {
    props: {
      data: { ...data, postConnection: postsResponse.data.postConnection },
      query,
      variables,
    },
  };
};
