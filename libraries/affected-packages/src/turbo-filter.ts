#!/usr/bin/env node
/* eslint-disable no-console */
import { getPackagesWithChanges } from './lib/getPackagesWithChanges';

export const main = async () => {
  try {
    const packagesWithChanges = await getPackagesWithChanges();

    if (packagesWithChanges.length === 0) {
      console.error('No packages changed, using Turborepo filter expression:');
      console.log('\'--filter=!*\'');
      return;
    }

    console.error(`Packages with changes: ${packagesWithChanges.map((p) => p.name).join(', ')}\n`);
    console.error('Turborepo filter expression:');
    console.log(`${packagesWithChanges.map((p) => `--filter=${p.name}`).join(' ')}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
