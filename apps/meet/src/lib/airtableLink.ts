export const getAirtableLink = ({
  baseId, tableId, viewId, recordId,
}: { baseId: string; tableId: string; recordId: string; viewId?: string }) => {
  return `https://airtable.com/${baseId}/${tableId}${viewId ? `/${viewId}` : ''}/${recordId}`;
};
