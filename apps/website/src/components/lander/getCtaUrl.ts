export const getCtaUrl = (variant: string) => {
  const thisPageQueryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : undefined);
  const miniextensionsQueryParams = new URLSearchParams();
  thisPageQueryParams.forEach((value, key) => {
    miniextensionsQueryParams.append(`prefill_${key}`, value);
  });
  miniextensionsQueryParams.append('prefill_Variant', variant);
  const ctaUrl = `https://web.miniextensions.com/aGd0mXnpcN1gfqlnYNZc?prefill_Topic=Let%27s%20Make%20The%20Future%20Awesome%20Course&${miniextensionsQueryParams.toString()}`;
  return ctaUrl;
};
