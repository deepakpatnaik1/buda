#!/usr/bin/env node

/**
 * BUDA CLI Entry Point
 * Boss Rules Development Architecture
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the main CLI application
import('../src/index.ts').catch((error) => {
  console.error('Failed to start BUDA CLI:', error);
  process.exit(1);
});