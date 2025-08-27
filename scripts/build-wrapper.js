#!/usr/bin/env node

/**
 * Build wrapper for LAMMPS JavaScript package
 * Copies WASM files and prepares the distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WASM_BUILD_DIR = path.join(__dirname, '../wasm');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

// Check if build is needed
function needsBuild() {
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.log('Build needed: dist directory missing');
    return true;
  }

  // Check if key files exist in dist
  const requiredFiles = ['lmp.wasm', 'lmp.js', 'index.js', 'package.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(DIST_DIR, file))) {
      console.log(`Build needed: ${file} missing from dist`);
      return true;
    }
  }

  // Check if source files are newer than dist files
  const srcFiles = ['index.js', 'types.js', 'lammps-worker.js'];
  for (const file of srcFiles) {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(srcPath) && fs.existsSync(distPath)) {
      const srcStats = fs.statSync(srcPath);
      const distStats = fs.statSync(distPath);
      
      if (srcStats.mtime > distStats.mtime) {
        console.log(`Build needed: ${file} has been modified`);
        return true;
      }
    }
  }

  // Check if WASM files are newer than dist files
  const wasmFiles = ['lmp.js', 'lmp.wasm'];
  for (const file of wasmFiles) {
    const wasmPath = path.join(WASM_BUILD_DIR, file);
    const distPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(wasmPath) && fs.existsSync(distPath)) {
      const wasmStats = fs.statSync(wasmPath);
      const distStats = fs.statSync(distPath);
      
      if (wasmStats.mtime > distStats.mtime) {
        console.log(`Build needed: ${file} has been rebuilt`);
        return true;
      }
    }
  }

  // Check if package.json version changed
  if (fs.existsSync(path.join(DIST_DIR, 'package.json'))) {
    const currentPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    const distPkg = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'package.json'), 'utf8'));
    
    if (currentPkg.version !== distPkg.version) {
      console.log(`Build needed: version changed from ${distPkg.version} to ${currentPkg.version}`);
      return true;
    }
  }

  return false;
}

// Early exit if no build needed
if (!needsBuild()) {
  console.log('✅ Build up to date, skipping');
  process.exit(0);
}

// Ensure directories exist
if (!fs.existsSync(SRC_DIR)) {
  fs.mkdirSync(SRC_DIR, { recursive: true });
}
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Copy WASM files to src (only if newer)
console.log('Checking WASM files...');
const wasmFiles = ['lmp.js', 'lmp.wasm'];

for (const filename of wasmFiles) {
  const srcPath = path.join(WASM_BUILD_DIR, filename);
  const destPath = path.join(SRC_DIR, filename);
  
  if (!fs.existsSync(srcPath)) {
    console.error(`✗ Error: ${srcPath} not found. Run build:wasm first.`);
    process.exit(1);
  }
  
  let shouldCopy = !fs.existsSync(destPath);
  
  if (!shouldCopy) {
    const srcStats = fs.statSync(srcPath);
    const destStats = fs.statSync(destPath);
    shouldCopy = srcStats.mtime > destStats.mtime;
  }
  
  if (shouldCopy) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${filename} to src/`);
  } else {
    console.log(`- ${filename} up to date`);
  }
}

// Copy all files from src to dist
console.log('\nBuilding distribution...');

// Copy directories recursively
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const srcItems = fs.readdirSync(SRC_DIR);
for (const item of srcItems) {
  const srcPath = path.join(SRC_DIR, item);
  const destPath = path.join(DIST_DIR, item);
  
  if (fs.statSync(srcPath).isDirectory()) {
    copyRecursive(srcPath, destPath);
    console.log(`✓ Copied directory ${item}/ to dist/`);
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${item} to dist/`);
  }
}

// Note: examples are served directly from examples/ directory using Vite dev server


// Create package.json for distribution
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  type: 'module',
  main: 'index.js',
  types: 'index.d.ts',
  module: 'index.mjs',
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.js',
      default: './index.js'
    },
    './worker': './lammps-worker.js',
    './wasm': './lmp.wasm'
  },
  repository: packageJson.repository,
  keywords: packageJson.keywords,
  author: packageJson.author,
  license: packageJson.license,
  bugs: packageJson.bugs,
  homepage: packageJson.homepage,
  engines: packageJson.engines
};

fs.writeFileSync(
  path.join(DIST_DIR, 'package.json'), 
  JSON.stringify(distPackageJson, null, 2)
);
console.log('✓ Created dist/package.json');

console.log('\n✅ Build wrapper complete!');