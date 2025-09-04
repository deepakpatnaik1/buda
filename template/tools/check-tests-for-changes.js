#!/usr/bin/env node
/**
 * TDD Enforcement Script - Boss Rule 2
 * Checks that new source files have corresponding test files
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const TESTABLE_EXTENSIONS = ['.ts', '.js', '.svelte'];
const TESTABLE_DIRECTORIES = ['src'];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=A', { 
      encoding: 'utf8' 
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('No staged files found.');
    return [];
  }
}

function getModifiedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', { 
      encoding: 'utf8' 
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // Fallback to staged files if we can't get HEAD~1
    return getStagedFiles();
  }
}

function isTestableFile(filePath) {
  const ext = path.extname(filePath);
  const isTestableExt = TESTABLE_EXTENSIONS.includes(ext);
  const isInTestableDir = TESTABLE_DIRECTORIES.some(dir => 
    filePath.startsWith(dir + '/')
  );
  const isTestFile = filePath.includes('.test.') || filePath.includes('.spec.');
  
  return isTestableExt && isInTestableDir && !isTestFile;
}

function getExpectedTestPath(filePath) {
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, path.extname(filePath));
  return path.join(dir, `${basename}.test.ts`);
}

function main() {
  const changedFiles = getModifiedFiles();
  const testableFiles = changedFiles.filter(isTestableFile);
  
  if (testableFiles.length === 0) {
    console.log('✅ No new testable source files detected.');
    process.exit(0);
  }

  const missingTests = [];
  
  for (const file of testableFiles) {
    const expectedTestPath = getExpectedTestPath(file);
    
    if (!existsSync(expectedTestPath)) {
      missingTests.push({
        source: file,
        expectedTest: expectedTestPath
      });
    }
  }

  if (missingTests.length > 0) {
    console.error('❌ TDD Violation: New source files without tests detected!');
    console.error('Boss Rule 2 requires tests for all new code.\n');
    
    missingTests.forEach(({ source, expectedTest }) => {
      console.error(`📁 ${source}`);
      console.error(`❓ Missing test: ${expectedTest}\n`);
    });
    
    console.error('Please create the missing test files before pushing.');
    console.error('Remember: Tests first, then implementation! 🛡️');
    process.exit(1);
  }

  console.log('✅ All new source files have corresponding tests.');
  process.exit(0);
}

main();
