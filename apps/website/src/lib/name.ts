export const joinName = (firstName: string, lastName: string): string => [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

// Best-effort split on the last space. Only for prefilling a form the user confirms; wrong for many names, so never bulk-apply.
export const splitName = (name: string): { firstName: string; lastName: string } => {
  const normalised = name.trim().replace(/\s+/g, ' ');
  const spaceIndex = normalised.lastIndexOf(' ');
  if (spaceIndex === -1) return { firstName: normalised, lastName: '' };
  return { firstName: normalised.slice(0, spaceIndex), lastName: normalised.slice(spaceIndex + 1) };
};
