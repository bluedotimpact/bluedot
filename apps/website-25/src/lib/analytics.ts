export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const isAnalyticsEnabled = () => {
  const hasMeasurementId = !!GA_MEASUREMENT_ID;

  return hasMeasurementId;
};
