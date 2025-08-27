/**
 * Build verification tests for LAMMPS WebAssembly
 * Simple tests for essential build artifacts
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

describe('Build Artifacts', () => {
  it('should have WASM files in src directory', () => {
    const srcDir = path.join(rootDir, 'src');
    const lmpJs = path.join(srcDir, 'lmp.js');
    const lmpWasm = path.join(srcDir, 'lmp.wasm');
    
    expect(fs.existsSync(lmpJs)).toBe(true);
    expect(fs.existsSync(lmpWasm)).toBe(true);
  });

  it('should have main module files', () => {
    const srcDir = path.join(rootDir, 'src');
    expect(fs.existsSync(path.join(srcDir, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(srcDir, 'types.js'))).toBe(true);
  });
});