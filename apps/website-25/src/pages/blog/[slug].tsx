import { useTina } from 'tinacms/dist/react';
import client from '../../../tina/__generated__/client';
import BlogDetail from '../../components/blog-details';

interface PostEdge {
  node: {
    _sys: {
      filename: string;
    };
  };
}

interface HomeProps {
  query: string;
  variables: {
    relativePath: string;
  };
  data: {
    post: any;
    postConnection?: {
      edges?: PostEdge[];
    };
  };
}

const Home = ({ query, variables, data }: HomeProps) => {
  // data passes though in production mode and data is updated to the sidebar data in edit-mode
  const { data: tinaData } = useTina({
    query,
    variables,
    data,
  });

  const relatedPosts = (tinaData?.postConnection?.edges?.length)
    ? tinaData.postConnection.edges
      ?.filter(
        (edge: PostEdge) => edge.node._sys.filename !== variables.relativePath,
      )
      .slice(0, 3)
      .map((edge: PostEdge) => edge.node)
    : [];

  return <BlogDetail relatedPosts={relatedPosts} post={tinaData.post} />;
};

export default Home;

export const getStaticPaths = async () => {
  const { data } = await client.queries.postConnection();
  const paths = data?.postConnection?.edges?.map((x) => {
    return { params: { slug: x?.node?._sys.filename } };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps = async (ctx: { params: { slug: string } }) => {
  const { data, query, variables } = await client.queries.post({
    relativePath: `${ctx.params.slug}.md`,
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
