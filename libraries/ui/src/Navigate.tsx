import { useRouter } from 'next/router';
import { useEffect } from 'react';

export type NavigateProps = {
  url: string;
};

/**
 * Redirects to a new page by rendering a component.
 * For example, attempting to render <Navigate url="/error" /> will take the user to the error page
 */
export const Navigate: React.FC<NavigateProps> = ({ url }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(url);
  // Note: exhaustive-deps disabled because this was known to generally work
  // before the lint rule was added, and this component could easily cause subtle
  // bugs. It may actually be more correct to include exhaustive dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
