import { Table, Item } from 'airtable-ts';

export type FormConfiguration = {
  'Slug': string,
  'Title': string,
  'Webhook': string,
  'Minimum length': number,
} & Item;

export const formConfigurationTable: Table<FormConfiguration> = {
  name: 'form configuration',
  baseId: 'app6dkBHka8c4WaEj',
  tableId: 'tblvsaRl69XV8azGZ',
  schema: {
    Slug: 'string',
    Title: 'string',
    Webhook: 'string',
    'Minimum length': 'number',
  },
  mappings: {
    Slug: 'fldrw0oSjFSMezFJ2',
    Title: 'fldHiGrJmyBvSdGUm',
    Webhook: 'fldoGERxuxQ17adXI',
    'Minimum length': 'fldUiReJ8a7hdV37E',
  },
};
