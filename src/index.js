/**
 * LAMMPS WebAssembly JavaScript Bindings
 * Main entry point for the lmpjs package
 */

// LAMMPS Web Worker wrapper class
class LAMMPSWorker {
  constructor(options = {}) {
    this.worker = new Worker(options.workerPath || new URL('./lammps-worker.js', import.meta.url));
    this.isReady = false;
    this.print = options.print || console.log;
    this.printErr = options.printErr || console.error;
    this.lmpPath = options.lmpPath || new URL('./lmp.js', import.meta.url).href;
    
    // File request callbacks
    this.fileCallbacks = new Map();
    
    // Set up message handling
    this.worker.onmessage = (e) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'ready':
          this.isReady = true;
          this.print('LAMMPS worker ready');
          break;
        case 'stdout':
          this.print(data);
          break;
        case 'stderr':
          this.printErr(data);
          break;
        case 'error':
          this.printErr('Error: ' + data);
          break;
        case 'completed':
          this.print('Simulation completed with exit code: ' + data.exitCode);
          break;
        case 'file-content':
          const callback = this.fileCallbacks.get(data.filename);
          if (callback) {
            callback.resolve(data.content);
            this.fileCallbacks.delete(data.filename);
          }
          break;
      }
    };
    
    this.worker.onerror = (error) => {
      this.printErr('Worker error: ' + error.message);
    };
    
    // Initialize the worker with the LAMMPS module path
    this.worker.postMessage({
      type: 'init',
      data: { lmpPath: this.lmpPath }
    });
  }
  
  // Wait for worker to be ready
  async waitForReady() {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
        return;
      }
      
      const checkReady = (e) => {
        if (e.data.type === 'ready') {
          this.worker.removeEventListener('message', checkReady);
          resolve();
        }
      };
      
      this.worker.addEventListener('message', checkReady);
    });
  }
  
  // Run LAMMPS with input content
  runFromString(inputContent) {
    if (!this.isReady) {
      throw new Error('LAMMPS worker not ready');
    }
    
    this.worker.postMessage({
      type: 'run-lammps',
      data: {
        inputContent: inputContent,
        inputFile: 'input.lmp'
      }
    });
  }

  // Mock FS object for compatibility
  get FS() {
    return {
      mkdir: () => {}, // No-op, worker handles this
      chdir: () => {}, // No-op, worker handles this
      writeFile: (path, content) => {
        // Send file to worker
        this.worker.postMessage({
          type: 'upload-file',
          data: {
            name: path.replace('/sim/', ''),
            content: typeof content === 'string' ? new TextEncoder().encode(content) : content
          }
        });
      },
      readFile: (path, options) => {
        // Extract filename from path
        const filename = path.replace('/sim/', '');
        
        return new Promise((resolve, reject) => {
          // Store callback for this file request
          this.fileCallbacks.set(filename, { resolve, reject });
          
          // Request file from worker
          this.worker.postMessage({
            type: 'get-file',
            data: { filename }
          });
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (this.fileCallbacks.has(filename)) {
              this.fileCallbacks.delete(filename);
              reject(new Error(`Timeout reading ${filename}`));
            }
          }, 5000);
        }).then(content => {
          // Handle encoding option
          if (options && options.encoding === 'utf8') {
            return new TextDecoder().decode(content);
          }
          return content;
        });
      }
    };
  }
  
  // Mock callMain for compatibility
  callMain(args) {
    if (args.length >= 2 && args[0] === '-in') {
      // Extract input file and run
      const inputFile = args[1];
      this.worker.postMessage({
        type: 'run-lammps',
        data: { inputFile }
      });
      return 0; // Return success
    }
    return -1;
  }
}

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

// Convenience function to create a new LAMMPS worker instance
export async function createLAMMPSWorker(options = {}) {
  const lammps = new LAMMPSWorker(options);
  await lammps.waitForReady();
  return lammps;
}

// Version information
export const version = '0.1.0';
export const description = 'JavaScript/WebAssembly bindings for LAMMPS';

// Export types for TypeScript users
export * from './types.js';