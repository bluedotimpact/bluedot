// Space walks the card's top-level sections one at a time, as the speed reviewer does:
// close everything, open the one after the last one Space opened, scroll to it. After the
// last section it starts again from the first. A new card starts the walk afresh.
export const openNextSection = (root: ParentNode = document) => {
  const sections = [...root.querySelectorAll<HTMLDetailsElement>('details')].filter((d) => !d.parentElement?.closest('details'));
  if (sections.length === 0) return;
  const walked = sections.findIndex((d) => d.dataset.walked === 'true');
  sections.forEach((d) => {
    d.open = false;
    delete d.dataset.walked;
  });
  const next = sections[(walked + 1) % sections.length]!;
  next.open = true;
  next.dataset.walked = 'true';
  const scroll = () => next.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  scroll();
  // The body renders after the toggle, so scroll again once it exists; near the bottom the first scroll falls short
  next.addEventListener('toggle', () => requestAnimationFrame(scroll), { once: true });
};
