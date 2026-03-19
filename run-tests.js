#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all test suites
 * Usage: node run-tests.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const testsDir = path.join(__dirname, 'tests');
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.test.js'))
  .map(file => path.join(testsDir, file));

console.log('🧪 Running Test Suite');
console.log('='.repeat(80));
console.log(`📁 Test directory: ${testsDir}`);
console.log(`📊 Test files: ${testFiles.length}`);
console.log('');

if (testFiles.length === 0) {
  console.error('❌ No test files found in tests directory');
  process.exit(1);
}

testFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${path.basename(file)}`);
});

console.log('='.repeat(80));
console.log('');

// Run mocha with test files
const mocha = spawn('npx', ['mocha', ...testFiles, '--reporter', 'spec', '--timeout', '10000'], {
  stdio: 'inherit',
  cwd: __dirname
});

mocha.on('exit', (code) => {
  console.log('');
  console.log('='.repeat(80));
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
  }
  console.log('='.repeat(80));
  process.exit(code);
});

mocha.on('error', (err) => {
  console.error('❌ Failed to run tests:', err);
  process.exit(1);
});
