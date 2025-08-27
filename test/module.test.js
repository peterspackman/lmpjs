/**
 * Module functionality tests for LAMMPS WebAssembly wrapper
 * Tests the JavaScript interface and exports
 */

import { describe, it, expect } from 'vitest';
import { createLAMMPS, version, description } from '../src/index.js';

describe('Module Exports', () => {
  it('should export createLAMMPS function', () => {
    expect(typeof createLAMMPS).toBe('function');
  });

  it('should export version string', () => {
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should export description string', () => {
    expect(typeof description).toBe('string');
    expect(description).toContain('LAMMPS');
  });

  it('should import types without errors', async () => {
    const { LAMMPSCommands, LAMMPSFileTypes } = await import('../src/types.js');
    
    expect(Array.isArray(LAMMPSCommands.UNITS)).toBe(true);
    expect(LAMMPSCommands.UNITS).toContain('lj');
    
    expect(Array.isArray(LAMMPSFileTypes.INPUT)).toBe(true);
    expect(LAMMPSFileTypes.INPUT).toContain('.lmp');
  });
});

