import { randomUUID } from 'crypto';

export const makeId = <Brand extends string>(type: Brand): string & { __brand: Brand } => {
  return `${type}_${randomUUID().replaceAll('-', '')}` as string & { __brand: Brand };
};

export const asId = <Brand extends string>(id: string, type: Brand): string & { __brand: Brand } => {
  if (!id.startsWith(`${type}_`)) {
    throw new Error(`Invalid id: id ${id} does not match type ${type}`);
  }
  if (id.length - type.length - 1 !== 32) {
    throw new Error(`Invalid id: core part of id ${id} is wrong length (expected 32, but got ${id.length - type.length - 1})`);
  }

  return id as string & { __brand: Brand };
};
