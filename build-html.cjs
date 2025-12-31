#!/usr/bin/env node
/**
 * Build standalone HTML from TypeScript build
 */
const fs = require('fs');
const path = require('path');

// Read the built IIFE bundle (instead of UMD to avoid AMD conflicts)
const bundlePath = path.join(__dirname, 'dist', 'mdebook.iife.js');
const bundle = fs.readFileSync(bundlePath, 'utf8');

// Read CSS
const cssPath = path.join(__dirname, 'src', 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Remove Tailwind directives (we'll use CDN)
css = css.replace(/@tailwind\s+\w+;/g, '');

// Create standalone HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MDebook v0.3 - Markdown eBook Editor</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- External dependencies (loaded before Monaco to avoid AMD conflicts) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  
  <!-- React (must load before app bundle) -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <script>
    // Initialize Mermaid
    mermaid.initialize({ 
      startOnLoad: false, 
      theme: 'dark',
      securityLevel: 'loose'
    });
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
  
  <!-- Monaco Editor (loaded after app bundle) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
  <script>
    // Configure Monaco loader
    require.config({ 
      paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
    });
  </script>
  
  <!-- Mount App -->
  <script>
    // Mount the React application
    (function() {
      var rootElement = document.getElementById('root');
      if (rootElement && typeof MDebook !== 'undefined' && MDebook.App) {
        var root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(MDebook.App));
      } else {
        console.error('MDebook or App not found', typeof MDebook);
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
