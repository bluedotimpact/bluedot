export const newTabProps = (openInNewTab: boolean) => {
  return {
    target: openInNewTab ? '_blank' : undefined,
    rel: openInNewTab ? 'noopener noreferrer' : undefined,
  };
};
