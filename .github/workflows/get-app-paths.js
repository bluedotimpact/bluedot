#!/usr/bin/env node

const { execSync } = require('node:child_process');

try {
  // Get the app name from command line argument
  const appName = process.argv[2];
  if (!appName) {
    console.error('App name must be provided as argument');
    process.exit(1);
  }

  // Run turbo dry run and parse output
  const turboOutput = execSync('npx turbo run build --dry=json', { encoding: 'utf-8' });
  const turboDryRun = JSON.parse(turboOutput);

  // Find the app's task
  const appTask = turboDryRun.tasks.find(task => {
    return task.package.startsWith('@bluedot/') && task.directory === `apps/${appName}`;
  });

  if (!appTask) {
    console.error(`Could not find task for app ${appName}`);
    process.exit(1);
  }

  // Initialize paths set with the app's own directory
  const paths = new Set([`apps/${appName}/**`]);
  paths.add('package-lock.json'); // Always include package-lock.json

  // Add all dependencies recursively
  const addDependencies = (deps) => {
    deps?.forEach(dep => {
      const depName = dep.split('#')[0]; // Remove #build suffix
      const depTask = turboDryRun.tasks.find(t => t.package === depName);
      
      if (!depTask) {
        console.error(`Could not find task for dependency ${depName}`);
        return;
      }

      // Only add paths for internal workspace dependencies
      if (depTask.directory.startsWith('libraries/')) {
        const depPath = `${depTask.directory}/**`;
        paths.add(depPath);
        
        // Recursively add this dependency's dependencies
        if (depTask.dependencies) {
          addDependencies(depTask.dependencies);
        }
      }
    });
  };
  
  addDependencies(appTask.dependencies);

  // Output the paths array in the format needed for skip-duplicate-actions
  console.log(JSON.stringify(Array.from(paths)));
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
