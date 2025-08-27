/**
 * LAMMPS WebAssembly JavaScript Bindings
 * Main entry point for the lmpjs package
 */

// Convenience function to create a new LAMMPS instance
export async function createLAMMPS(options = {}) {
  // Import the WebAssembly module
  const LAMMPSModule = await import('./lmp.js');
  
  // Create and configure the module
  const module = await LAMMPSModule.default({
    print: options.print || console.log,
    printErr: options.printErr || console.error,
    ...options
  });
  
  return module;
}

// Version information
export const version = '0.1.0';
export const description = 'JavaScript/WebAssembly bindings for LAMMPS';

// Export types for TypeScript users
export * from './types.js';