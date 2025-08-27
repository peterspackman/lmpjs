#!/usr/bin/env node

/**
 * Build script for LAMMPS JavaScript package
 * Downloads LAMMPS source from GitHub and builds WebAssembly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

async function downloadLammps() {
  console.log('Fetching latest LAMMPS release...');
  
  // Get latest release from GitHub API
  const response = await fetch('https://api.github.com/repos/lammps/lammps/releases/latest');
  const release = await response.json();
  
  const tarballUrl = release.tarball_url;
  const version = release.tag_name;
  
  console.log(`Found LAMMPS ${version}`);
  console.log(`Downloading from: ${tarballUrl}`);
  
  const sourceDir = path.join(ROOT_DIR, 'lammps-src');
  
  // Clean existing source
  if (fs.existsSync(sourceDir)) {
    fs.rmSync(sourceDir, { recursive: true });
  }
  
  // Download and extract
  const tarResponse = await fetch(tarballUrl);
  const tarBuffer = Buffer.from(await tarResponse.arrayBuffer());
  
  // Create temp file
  const tempTar = path.join(ROOT_DIR, 'lammps.tar.gz');
  fs.writeFileSync(tempTar, tarBuffer);
  
  // Extract
  await runCommand('mkdir', ['-p', sourceDir]);
  await runCommand('tar', ['-xzf', tempTar, '-C', sourceDir, '--strip-components=1']);
  
  // Clean up
  fs.unlinkSync(tempTar);
  
  console.log('✓ LAMMPS source downloaded and extracted');
  return sourceDir;
}

async function buildWasm(sourceDir) {
  console.log('Building LAMMPS WebAssembly...');
  
  const buildDir = path.join(ROOT_DIR, 'wasm');
  const cmakeDir = path.join(sourceDir, 'cmake');
  
  // Clean previous build
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true });
  }
  
  // Copy pre-js file to scripts
  const preJsContent = `
// Override stdin and prompt to prevent browser modal dialogs
if (typeof Module === 'undefined') var Module = {};
Module.stdin = function() { return null; };
if (typeof prompt !== 'undefined') {
    var originalPrompt = prompt;
    prompt = function() { return null; };
}
`;
  
  const preJsPath = path.join(__dirname, 'lammps-pre.js');
  fs.writeFileSync(preJsPath, preJsContent);
  
  // Configure with emscripten
  const configureArgs = [
    'emcmake', 'cmake', cmakeDir, `-B${buildDir}`,
    '-DCMAKE_BUILD_TYPE=Release',
    '-DCMAKE_CXX_FLAGS=-O3',
    `-DCMAKE_EXE_LINKER_FLAGS=-s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=268435456 -s MAXIMUM_MEMORY=2147483648 -s FORCE_FILESYSTEM=1 -s NO_EXIT_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=['callMain','FS'] --pre-js ${preJsPath}`,
    '-DBUILD_SHARED_LIBS=OFF',
    '-DLAMMPS_EXCEPTIONS=ON',
    '-DPKG_ASPHERE=OFF',
    '-DPKG_BODY=OFF',
    '-DPKG_CLASS2=ON',
    '-DPKG_COLLOID=OFF',
    '-DPKG_COMPRESS=OFF',
    '-DPKG_CORESHELL=OFF',
    '-DPKG_DIPOLE=OFF',
    '-DPKG_GRANULAR=OFF',
    '-DPKG_MC=OFF',
    '-DPKG_MISC=OFF',
    '-DPKG_MOLECULE=ON',
    '-DPKG_PERI=OFF',
    '-DPKG_QEQ=OFF',
    '-DPKG_RIGID=OFF',
    '-DPKG_SHOCK=OFF',
    '-DPKG_SNAP=OFF',
    '-DPKG_SRD=OFF',
    '-DPKG_KSPACE=ON',
    '-DPKG_MANYBODY=ON',
    '-DPKG_EXTRA-PAIR=ON',
    '-DPKG_EXTRA-FIX=ON',
    '-DPKG_EXTRA-DUMP=ON',
    '-DPKG_EXTRA-MOLECULE=ON',
    '-DPKG_OPENMP=OFF',
    '-DPKG_MPI=OFF',
    '-DWITH_JPEG=OFF',
    '-DWITH_PNG=OFF',
    '-DWITH_FFMPEG=OFF',
    '-DWITH_GZIP=OFF',
    '-GNinja'
  ];
  
  console.log('Configuring LAMMPS for WebAssembly...');
  await runCommand(configureArgs[0], configureArgs.slice(1));
  
  // Build
  console.log('Building LAMMPS...');
  await runCommand('cmake', ['--build', buildDir, '--target', 'lmp']);
  
  // Check if build succeeded
  const wasmFile = path.join(buildDir, 'lmp.wasm');
  const jsFile = path.join(buildDir, 'lmp.js');
  
  if (!fs.existsSync(wasmFile) || !fs.existsSync(jsFile)) {
    throw new Error('Build failed - WebAssembly files not found');
  }
  
  console.log('✓ LAMMPS WebAssembly build complete');
  return buildDir;
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      cwd: ROOT_DIR
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function main() {
  try {
    const sourceDir = await downloadLammps();
    await buildWasm(sourceDir);
    
    console.log('\n✅ Build complete!');
    console.log('WebAssembly files:');
    console.log('- wasm/lmp.js');
    console.log('- wasm/lmp.wasm');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}