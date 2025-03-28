export const getCtaUrl = (variant: string) => {
  const queryParams = new URLSearchParams(window.location.search);
  queryParams.append('prefill_Variant', variant);
  const ctaUrl = `https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc?prefill_Topic=Let%27s%20Make%20The%20Future%20Awesome%20Course&${queryParams.toString()}`;
  return ctaUrl;
};
