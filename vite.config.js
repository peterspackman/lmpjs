import { defineConfig } from 'vite'

export default defineConfig({
  root: 'examples',
  
  server: {
    port: 8080,
    host: true
  },
  
  optimizeDeps: {
    // Don't pre-bundle WebAssembly files
    exclude: []
  },
  
  // Ensure proper handling of WebAssembly and worker files
  assetsInclude: ['**/*.wasm'],
  
  // Custom plugin to serve WASM files with correct MIME type
  plugins: [
    {
      name: 'wasm-mime',
      configureServer(server) {
        server.middlewares.use('/', (req, res, next) => {
          if (req.url && req.url.endsWith('.wasm')) {
            // Set correct MIME type for WASM files
            res.setHeader('Content-Type', 'application/wasm')
          }
          next()
        })
      }
    }
  ]
})