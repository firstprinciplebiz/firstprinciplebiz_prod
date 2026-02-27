#!/usr/bin/env node
/**
 * Custom bundling script for Android that correctly handles monorepo setup.
 * This script is called by Gradle instead of expo export:embed directly.
 */

const { execSync } = require('child_process');
const path = require('path');

// Get the mobile app root directory
const mobileRoot = path.resolve(__dirname, '..');

// Parse arguments
const args = process.argv.slice(2);

// Find and modify the --entry-file argument to use absolute path
const entryFileIndex = args.indexOf('--entry-file');
if (entryFileIndex !== -1 && args[entryFileIndex + 1]) {
  const entryFile = args[entryFileIndex + 1];
  if (!path.isAbsolute(entryFile)) {
    args[entryFileIndex + 1] = path.join(mobileRoot, entryFile);
  }
}

// Build the command
const cmd = `npx expo export:embed ${args.join(' ')}`;

console.log('Running:', cmd);
console.log('Working directory:', mobileRoot);

try {
  execSync(cmd, {
    cwd: mobileRoot,
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (error) {
  process.exit(error.status || 1);
}





