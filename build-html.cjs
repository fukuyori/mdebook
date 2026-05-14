#!/usr/bin/env node
/**
 * Build standalone HTML from TypeScript build
 */
const fs = require('fs');
const path = require('path');

// Read version from constants
const constantsPath = path.join(__dirname, 'src', 'constants', 'index.ts');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');
const versionMatch = constantsContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
const VERSION = versionMatch ? versionMatch[1] : '0.0.0';

// Read the built IIFE bundle (instead of UMD to avoid AMD conflicts)
const bundlePath = path.join(__dirname, 'dist', 'mdebook.iife.js');
const bundle = fs.readFileSync(bundlePath, 'utf8');

// Read CSS
const cssPath = path.join(__dirname, 'src', 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Inline React runtime so the standalone HTML can start even when CDNs are blocked.
const reactBundle = fs.readFileSync(
  path.join(__dirname, 'node_modules', 'react', 'umd', 'react.production.min.js'),
  'utf8'
);
const reactDomBundle = fs.readFileSync(
  path.join(__dirname, 'node_modules', 'react-dom', 'umd', 'react-dom.production.min.js'),
  'utf8'
);

// Remove Tailwind directives (we'll use CDN)
css = css.replace(/@tailwind\s+\w+;/g, '');

// Create standalone HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MDebook v${VERSION} - Markdown eBook Editor</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- External dependencies -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  
  <!-- pdfmake for PDF export -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.min.js"></script>
  
  <!-- React runtime (inlined for standalone reliability) -->
  <script>
${reactBundle}
  </script>
  <script>
${reactDomBundle}
  </script>
  <script>
    // The production JSX runtime bundled by Vite calls require('react').
    // Provide only the modules the standalone bundle needs.
    (function() {
      var modules = {
        react: window.React,
        'react-dom': window.ReactDOM
      };

      window.require = function(name) {
        if (typeof name === 'string' && modules[name]) {
          return modules[name];
        }
        throw new Error('Standalone module is not available: ' + name);
      };
      window.require.config = function() {};
    })();
  </script>
  
  <script>
    // Initialize Mermaid
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'dark',
        securityLevel: 'loose'
      });
    }
  </script>
  
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
    #root { min-height: 100vh; }
    
    /* Preview styles */
    ${css}
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- Application Bundle (IIFE format - loads before Monaco to avoid AMD conflicts) -->
  <script>
${bundle}
  </script>
  
  <!-- Mount App -->
  <script>
    // Mount the React application
    (function() {
      function showStartupError(message, error) {
        var rootElement = document.getElementById('root');
        if (!rootElement) return;
        var details = error && (error.stack || error.message) ? '\\n\\n' + (error.stack || error.message) : '';
        rootElement.innerHTML = '<pre style="margin:24px;padding:16px;white-space:pre-wrap;background:#111827;color:#f9fafb;border-radius:8px;font:14px/1.5 Consolas,monospace;"></pre>';
        rootElement.querySelector('pre').textContent = message + details;
      }

      try {
        var rootElement = document.getElementById('root');
        if (!rootElement) {
          throw new Error('Root element was not found.');
        }
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || !ReactDOM.createRoot) {
          throw new Error('React runtime was not loaded.');
        }
        if (typeof MDebook === 'undefined' || !MDebook.App) {
          throw new Error('MDebook application bundle was not loaded.');
        }

        var root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(MDebook.App));
      } catch (error) {
        console.error('MDebook startup failed', error);
        showStartupError('MDebook failed to start.', error);
      }
    })();
  </script>
</body>
</html>`;

// Write output
const outputPath = path.join(__dirname, 'dist', 'mdebook.html');
fs.writeFileSync(outputPath, html);

console.log('Standalone HTML created: dist/mdebook.html');
console.log('Size:', Math.round(html.length / 1024), 'KB');
