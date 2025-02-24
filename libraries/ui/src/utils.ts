export const EXTERNAL_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;

export type BluedotRoute = {
  /**
   * Title of the page, by convention this is the title that appears in the
   * <title /> tag (e.g. "About us" in "About us | BlueDot Impact")
   */
  title: string;
  /**
   * Relative url of the route (e.g. /about, not https://bluedot.org/about)
   */
  url: string;
  /**
   * Parent pages of the route (to appear in the <Breadcrumbs /> component)
   */
  parentPages?: Pick<BluedotRoute, 'title' | 'url'>[];
};
