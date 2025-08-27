/**
 * TypeScript definitions for LAMMPS WebAssembly JavaScript Bindings
 */

export interface LAMMPSOptions {
  /** Function to handle stdout output */
  print?: (text: string) => void;
  /** Function to handle stderr output */
  printErr?: (text: string) => void;
  /** Initial memory size in bytes (default: 256MB) */
  INITIAL_MEMORY?: number;
  /** Maximum memory size in bytes (default: 2GB) */
  MAXIMUM_MEMORY?: number;
  /** Allow memory growth (default: true) */
  ALLOW_MEMORY_GROWTH?: boolean;
  /** Do not exit runtime (default: true) */
  NO_EXIT_RUNTIME?: boolean;
  /** Force filesystem (default: true) */
  FORCE_FILESYSTEM?: boolean;
}

export interface LAMMPSFileSystem {
  /** Create a directory */
  mkdir(path: string): void;
  /** Write a file */
  writeFile(path: string, data: string | Uint8Array): void;
  /** Read a file */
  readFile(path: string, options?: { encoding?: string }): string | Uint8Array;
  /** Delete a file */
  unlink(path: string): void;
  /** Change working directory */
  chdir(path: string): void;
  /** List directory contents */
  readdir(path: string): string[];
  /** Check if file/directory exists */
  stat(path: string): { isDirectory(): boolean; size: number };
}

export interface LAMMPSModule {
  /** Execute LAMMPS with command line arguments */
  callMain(args: string[]): number;
  /** Virtual filesystem interface */
  FS: LAMMPSFileSystem;
  /** Print function for stdout */
  print: (text: string) => void;
  /** Print function for stderr */
  printErr: (text: string) => void;
}

/**
 * Create a new LAMMPS WebAssembly module instance
 * @param options Configuration options
 * @returns Promise that resolves to a LAMMPS module instance
 */
export function createLAMMPS(options?: LAMMPSOptions): Promise<LAMMPSModule>;

/**
 * LAMMPS WebAssembly module constructor
 * @param options Module configuration options
 * @returns Promise that resolves to a LAMMPS module
 */
export function LAMMPS(options?: LAMMPSOptions): Promise<LAMMPSModule>;

/** Package version */
export const version: string;

/** Package description */
export const description: string;

// Constants and enums

export declare namespace LAMMPSConstants {
  /** Common LAMMPS units */
  const UNITS: readonly ['lj', 'real', 'metal', 'si', 'cgs', 'electron', 'micro', 'nano'];
  
  /** Common atom styles */
  const ATOM_STYLES: readonly ['atomic', 'molecular', 'charge', 'bond', 'angle', 'full'];
  
  /** Boundary condition types */
  const BOUNDARY_CONDITIONS: readonly ['p', 'f', 's', 'm'];
  
  /** Common pair styles */
  const PAIR_STYLES: readonly [
    'lj/cut', 'lj/cut/coul/cut', 'lj/cut/coul/long',
    'morse', 'buck', 'buck/coul/cut', 'buck/coul/long',
    'table', 'hybrid', 'hybrid/overlay'
  ];
}

export declare namespace LAMMPSFileTypes {
  /** Input file extensions */
  const INPUT: readonly ['.lmp', '.in', '.inp', '.lammps'];
  
  /** Data file extensions */
  const DATA: readonly ['.data', '.dat'];
  
  /** Potential file extensions */
  const POTENTIAL: readonly ['.pot', '.eam', '.fs', '.table'];
  
  /** Output file extensions */
  const OUTPUT: readonly ['.log', '.out', '.dump', '.xyz', '.dcd'];
  
  /** Restart file extensions */
  const RESTART: readonly ['.restart', '.rst'];
}

// Default export for CommonJS compatibility
export default {
  createLAMMPS,
  LAMMPS,
  version,
  description,
  LAMMPSConstants,
  LAMMPSFileTypes
};