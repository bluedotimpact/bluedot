#!/usr/bin/env node
/* eslint-disable no-console */
import { getPackagesWithChanges } from './lib/getPackagesWithChanges';

export const main = async () => {
  try {
    const packagesWithChanges = await getPackagesWithChanges();
    const deployableChangedPackages = packagesWithChanges.filter((p) => p.isDeployableByCd);

    console.error(`${deployableChangedPackages.length} packages changed:`);
    console.log(JSON.stringify(deployableChangedPackages.map((p) => p.name)));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
