#!/usr/bin/env node

const { execSync } = require('node:child_process');

try {
  // Run turbo dry run and parse output
  const turboOutput = execSync('npx turbo run build --dry=json', { encoding: 'utf-8' });
  const turboDryRun = JSON.parse(turboOutput);

  // Initialize paths filter object
  const pathsFilter = {};
  
  // Get all tasks for apps (not libraries)
  const appTasks = turboDryRun.tasks.filter(task => {
    const packageName = task.package;
    return packageName.startsWith('@bluedot/') && task.directory.startsWith('apps/');
  });
  
  appTasks.forEach(task => {
    const appName = task.directory.replace('apps/', '');
    const paths = new Set([`${task.directory}/**`]);
        
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
    
    addDependencies(task.dependencies);
        
    pathsFilter[appName] = {
      paths: Array.from(paths)
    };
  });

  // Write the paths filter to stdout
  const result = JSON.stringify(pathsFilter, null, 2);
  console.log(result);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
