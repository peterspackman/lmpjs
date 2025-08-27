/**
 * Type definitions and interfaces for LAMMPS WebAssembly
 */

// Basic LAMMPS configuration options
export const LAMMPSOptions = {
  // Output handlers
  print: null,        // Function to handle stdout
  printErr: null,     // Function to handle stderr
  
  // Memory settings
  INITIAL_MEMORY: 268435456,      // 256MB
  MAXIMUM_MEMORY: 2147483648,     // 2GB
  ALLOW_MEMORY_GROWTH: true,
  
  // Runtime settings
  NO_EXIT_RUNTIME: true,
  FORCE_FILESYSTEM: true
};

// Common LAMMPS commands and utilities
export const LAMMPSCommands = {
  // Basic simulation setup
  UNITS: ['lj', 'real', 'metal', 'si', 'cgs', 'electron', 'micro', 'nano'],
  ATOM_STYLES: ['atomic', 'molecular', 'charge', 'bond', 'angle', 'full'],
  BOUNDARY_CONDITIONS: ['p', 'f', 's', 'm'],
  
  // Common pair styles
  PAIR_STYLES: [
    'lj/cut', 'lj/cut/coul/cut', 'lj/cut/coul/long',
    'morse', 'buck', 'buck/coul/cut', 'buck/coul/long',
    'table', 'hybrid', 'hybrid/overlay'
  ]
};

// File extensions commonly used with LAMMPS
export const LAMMPSFileTypes = {
  INPUT: ['.lmp', '.in', '.inp', '.lammps'],
  DATA: ['.data', '.dat'],
  POTENTIAL: ['.pot', '.eam', '.fs', '.table'],
  OUTPUT: ['.log', '.out', '.dump', '.xyz', '.dcd'],
  RESTART: ['.restart', '.rst']
};