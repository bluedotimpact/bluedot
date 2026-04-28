const INVOICE_FORM_URL = 'https://airtable.com/appMVNtdBtvtJvu5E/pagPCAKkFmHDTCoQ7/form';

export type InvoiceParams = {
  firstName: string;
  lastName: string;
  email: string;
  compensationLumpSum: number;
  roundTitle: string;
  contractStartDate: string;
  contractEndDate: string;
};

// Round/discussion dates come from the DB as ISO datetimes (e.g. "2026-04-27T00:00:00.000Z").
// The Airtable form's date field accepts YYYY-MM-DD.
const toYyyyMmDd = (value: string): string => value.slice(0, 10);

export const generateInvoiceUrl = (params: InvoiceParams): string => {
  const search = new URLSearchParams({
    'prefill_Hourly or lump sum': 'Lump sum',
    'prefill_Start date': toYyyyMmDd(params.contractStartDate),
    'prefill_End date': toYyyyMmDd(params.contractEndDate),
    'prefill_Compensation (lump sum)': String(params.compensationLumpSum),
    prefill_Email: params.email,
    'prefill_First name': params.firstName,
    'prefill_Last name': params.lastName,
    prefill_Activity: `${params.roundTitle} facilitator compensation`,
  });
  // Airtable form prefill requires %20 for spaces; URLSearchParams encodes them as '+'
  return `${INVOICE_FORM_URL}?${search.toString().replace(/\+/g, '%20')}`;
};
