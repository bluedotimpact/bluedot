#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn } = require('child_process');
const path = require('path');

// Get the command from command line arguments
const command = process.argv[2] || '<blank>';

// Map commands to script files
const scriptMap = {
  'multistage-deploy-production': 'multistage/deploy-production.sh',
  'multistage-deploy-staging': 'multistage/deploy-staging.sh',
  start: 'start.sh',
  deploy: 'deploy.sh',
  test: 'test.sh',
};

const scriptFile = scriptMap[command];
const scriptPath = path.join(__dirname, scriptFile);

if (!scriptFile) {
  console.error(`Unknown command: ${command}`);
  console.error('Available commands:', Object.keys(scriptMap).join(', '));
  process.exit(1);
}

// Execute the bash script
const child = spawn('bash', [scriptPath], {
  stdio: 'inherit', // This will pipe the script's stdout/stderr to the parent process
  cwd: process.cwd(), // Set working directory to where the command was called from
});

child.on('error', (error) => {
  console.error(`Error executing script: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
