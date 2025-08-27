// LAMMPS WebAssembly Worker
// Runs LAMMPS in background thread to avoid blocking UI

let isInitialized = false;

// Debug logging
self.postMessage({
    type: 'stdout',
    data: 'LAMMPS worker script started'
});

// Set up Module configuration before importing
var Module = {
    print: function(text) {
        // Send stdout to main thread
        self.postMessage({
            type: 'stdout',
            data: text
        });
    },
    printErr: function(text) {
        // Send stderr to main thread
        self.postMessage({
            type: 'stderr', 
            data: text
        });
    },
    onRuntimeInitialized: function() {
        // Create simulation directory
        try {
            this.FS.mkdir('/sim');
            
            self.postMessage({
                type: 'stdout',
                data: 'Filesystem created. LAMMPS ready for use.'
            });
            
            isInitialized = true;
            self.postMessage({
                type: 'ready',
                data: 'LAMMPS WebAssembly worker initialized'
            });
        } catch (err) {
            self.postMessage({
                type: 'error',
                data: 'Failed to initialize: ' + err.message
            });
        }
    },
    
    // Add more debugging callbacks
    onAbort: function(what) {
        self.postMessage({
            type: 'error',
            data: 'WebAssembly aborted: ' + what
        });
    },
    
    onExit: function(status) {
        self.postMessage({
            type: 'stdout',
            data: 'WebAssembly exited with status: ' + status
        });
    }
};

// Import the LAMMPS WebAssembly module after setting up Module
self.postMessage({
    type: 'stdout', 
    data: 'About to import lmp.js...'
});

try {
    importScripts('lmp.js');
    self.postMessage({
        type: 'stdout',
        data: 'lmp.js imported successfully'
    });
} catch (err) {
    self.postMessage({
        type: 'error',
        data: 'Failed to import lmp.js: ' + err.message
    });
}

// Set a timeout to detect if initialization hangs
setTimeout(function() {
    if (!isInitialized) {
        self.postMessage({
            type: 'error',
            data: 'WebAssembly initialization timeout after 10 seconds'
        });
    }
}, 10000);

// Handle messages from main thread
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'upload-file':
            handleFileUpload(data);
            break;
            
        case 'run-lammps':
            runLammps(data);
            break;
            
        case 'delete-file':
            deleteFile(data.filename);
            break;
            
        case 'cleanup':
            cleanup();
            break;
            
        case 'get-file':
            getFile(data.filename);
            break;
            
        default:
            self.postMessage({
                type: 'error',
                data: 'Unknown message type: ' + type
            });
    }
};

function handleFileUpload(fileData) {
    if (!isInitialized) {
        self.postMessage({
            type: 'error',
            data: 'Worker not initialized yet'
        });
        return;
    }
    
    try {
        Module.FS.writeFile('/sim/' + fileData.name, new Uint8Array(fileData.content));
        self.postMessage({
            type: 'file-uploaded',
            data: 'Uploaded: ' + fileData.name
        });
    } catch (err) {
        self.postMessage({
            type: 'error',
            data: 'Failed to upload ' + fileData.name + ': ' + err.message
        });
    }
}

function runLammps(runData) {
    if (!isInitialized) {
        self.postMessage({
            type: 'error',
            data: 'Worker not initialized yet'
        });
        return;
    }
    
    try {
        self.postMessage({
            type: 'stdout',
            data: '=== Starting LAMMPS run ==='
        });
        
        // Write input file if provided
        if (runData.inputContent) {
            Module.FS.writeFile('/sim/input.lmp', runData.inputContent);
            runData.inputFile = 'input.lmp';
        }
        
        // Change to simulation directory
        Module.FS.chdir('/sim');
        
        // Set up arguments (single-threaded)
        const args = ['-in', runData.inputFile];
        
        self.postMessage({
            type: 'stdout',
            data: '> lmp -in ' + runData.inputFile
        });
        
        // Run LAMMPS
        const exitCode = Module.callMain ? Module.callMain(args) : 0;
        
        self.postMessage({
            type: 'completed',
            data: {
                exitCode: exitCode,
                message: 'Run completed with exit code: ' + exitCode
            }
        });
        
    } catch (err) {
        self.postMessage({
            type: 'error',
            data: 'Execution error: ' + err.message
        });
    }
}

function deleteFile(filename) {
    if (!isInitialized) return;
    
    try {
        Module.FS.unlink('/sim/' + filename);
        self.postMessage({
            type: 'file-deleted',
            data: 'Deleted: ' + filename
        });
    } catch (err) {
        // File might not exist, ignore
    }
}

function getFile(filename) {
    if (!isInitialized) {
        self.postMessage({
            type: 'error',
            data: 'Worker not initialized yet'
        });
        return;
    }
    
    try {
        const fileContent = Module.FS.readFile('/sim/' + filename);
        self.postMessage({
            type: 'file-content',
            data: {
                filename: filename,
                content: fileContent
            }
        });
    } catch (err) {
        self.postMessage({
            type: 'error',
            data: 'Failed to read ' + filename + ': ' + err.message
        });
    }
}

function cleanup() {
    if (!isInitialized) return;
    
    try {
        // Clean up simulation directory
        const files = Module.FS.readdir('/sim');
        files.forEach(file => {
            if (file !== '.' && file !== '..') {
                try {
                    Module.FS.unlink('/sim/' + file);
                } catch (err) {
                    // Ignore errors
                }
            }
        });
        
        self.postMessage({
            type: 'stdout',
            data: 'Simulation files cleaned up'
        });
    } catch (err) {
        self.postMessage({
            type: 'error',
            data: 'Cleanup error: ' + err.message
        });
    }
}