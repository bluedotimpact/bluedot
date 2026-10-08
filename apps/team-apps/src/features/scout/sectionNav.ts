// Space walks the card's top-level sections one at a time, as the speed reviewer does:
// close everything, open the one after the first open section, scroll to it.
export const openNextSection = (root: ParentNode = document) => {
  const sections = [...root.querySelectorAll<HTMLDetailsElement>('details')].filter((d) => !d.parentElement?.closest('details'));
  const openIndex = sections.findIndex((d) => d.open);
  sections.forEach((d) => {
    d.open = false;
  });
  const next = sections[openIndex + 1];
  if (next) {
    next.open = true;
    next.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
};
