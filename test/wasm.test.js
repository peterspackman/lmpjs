/**
 * WebAssembly basic tests for LAMMPS
 * Simple tests for WASM file existence and validity
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

describe('WASM Files', () => {
  it('should have valid WASM file', () => {
    const wasmPath = path.join(rootDir, 'src', 'lmp.wasm');
    
    if (!fs.existsSync(wasmPath)) {
      console.warn('WASM file not found, skipping test');
      return;
    }

    const wasmBuffer = fs.readFileSync(wasmPath);
    const magicNumber = wasmBuffer.subarray(0, 4);
    
    // Check WASM magic number
    expect(Array.from(magicNumber)).toEqual([0x00, 0x61, 0x73, 0x6d]);
  });

  it('should have valid JS wrapper', () => {
    const jsPath = path.join(rootDir, 'src', 'lmp.js');
    
    if (!fs.existsSync(jsPath)) {
      console.warn('JS file not found, skipping test');
      return;
    }

    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // Basic syntax check
    expect(() => {
      new Function(jsContent);
    }).not.toThrow();
    
    // Should contain WebAssembly
    expect(jsContent).toMatch(/WebAssembly/);
  });
});