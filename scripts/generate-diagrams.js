const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VENDOR_DIR = path.join(__dirname, 'vendor');
const MERMAID_PATH = path.join(VENDOR_DIR, 'mermaid.min.js');
const DIAGRAMS_DIR = path.resolve(__dirname, '..', 'docs', 'diagrams');
const SVG_DIR = path.join(DIAGRAMS_DIR, 'svg');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function ensureMermaid() {
  if (!fs.existsSync(VENDOR_DIR)) {
    fs.mkdirSync(VENDOR_DIR, { recursive: true });
  }
  if (!fs.existsSync(MERMAID_PATH)) {
    console.log('Downloading mermaid.min.js (v10.9.1)...');
    const resp = await fetch('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js');
    if (!resp.ok) throw new Error(`Failed to download mermaid: ${resp.status}`);
    const code = await resp.text();
    fs.writeFileSync(MERMAID_PATH, code, 'utf-8');
    console.log('Saved mermaid.min.js to', MERMAID_PATH);
  }
}

async function renderDiagrams() {
  await ensureMermaid();

  if (!fs.existsSync(SVG_DIR)) {
    fs.mkdirSync(SVG_DIR, { recursive: true });
  }

  const mmdFiles = fs.readdirSync(DIAGRAMS_DIR).filter(f => f.endsWith('.mmd'));
  console.log(`Found ${mmdFiles.length} Mermaid diagram files:`, mmdFiles);

  const diagramData = mmdFiles.map(file => {
    const name = path.basename(file, '.mmd');
    const code = fs.readFileSync(path.join(DIAGRAMS_DIR, file), 'utf-8');
    return { name, file, code };
  });

  const mermaidScript = fs.readFileSync(MERMAID_PATH, 'utf-8');

  // Create an HTML runner
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mermaid SVG Generator</title>
</head>
<body>
  <div id="output"></div>
  <script>
    ${mermaidScript}
  </script>
  <script>
    const diagrams = ${JSON.stringify(diagramData)};
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'Segoe UI, -apple-system, sans-serif'
    });

    async function run() {
      const container = document.getElementById('output');
      for (const diag of diagrams) {
        try {
          const id = 'render_' + diag.name.replace(/[^a-zA-Z0-9]/g, '_');
          const { svg } = await mermaid.render(id, diag.code);
          const box = document.createElement('div');
          box.id = 'svg_' + diag.name;
          box.setAttribute('data-name', diag.name);
          box.innerHTML = svg;
          container.appendChild(box);
        } catch (err) {
          const errBox = document.createElement('div');
          errBox.id = 'error_' + diag.name;
          errBox.setAttribute('data-name', diag.name);
          errBox.textContent = 'ERROR: ' + err.message;
          container.appendChild(errBox);
        }
      }
      document.body.setAttribute('data-rendered', 'true');
    }
    run();
  </script>
</body>
</html>`;

  const runnerHtmlPath = path.join(__dirname, 'temp_runner.html');
  fs.writeFileSync(runnerHtmlPath, htmlContent, 'utf-8');

  try {
    const fileUrl = 'file:///' + runnerHtmlPath.replace(/\\/g, '/');
    const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --virtual-time-budget=15000 --dump-dom "${fileUrl}"`;
    console.log('Running browser renderer via:', CHROME_PATH);
    const stdout = execSync(cmd, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });

    let successCount = 0;
    let failCount = 0;

    for (const diag of diagramData) {
      const errRegex = new RegExp(`<div id="error_${diag.name}"[^>]*>([\\s\\S]*?)<\\/div>`);
      const errMatch = stdout.match(errRegex);
      if (errMatch) {
        console.error(`❌ [${diag.file}] Syntax / Render Error:`, errMatch[1].trim());
        failCount++;
        continue;
      }

      // Extract SVG
      const svgBoxRegex = new RegExp(`<div id="svg_${diag.name}"[^>]*>([\\s\\S]*?)<\\/div>`);
      const match = stdout.match(svgBoxRegex);
      if (match) {
        let svgCode = match[1].trim();
        // Ensure proper xml declaration or svg root
        if (!svgCode.startsWith('<?xml') && !svgCode.startsWith('<svg')) {
          const svgStart = svgCode.indexOf('<svg');
          if (svgStart !== -1) {
            svgCode = svgCode.substring(svgStart);
          }
        }
        const svgPath = path.join(SVG_DIR, `${diag.name}.svg`);
        fs.writeFileSync(svgPath, svgCode, 'utf-8');
        console.log(`✅ [${diag.file}] ➔ ${path.relative(process.cwd(), svgPath)} (${(svgCode.length / 1024).toFixed(1)} KB)`);
        successCount++;
      } else {
        console.error(`⚠️ [${diag.file}] SVG not found in dump-dom output!`);
        failCount++;
      }
    }

    console.log(`\nRender Summary: ${successCount} succeeded, ${failCount} failed.`);
    if (failCount > 0) {
      process.exit(1);
    }
  } finally {
    if (fs.existsSync(runnerHtmlPath)) {
      fs.unlinkSync(runnerHtmlPath);
    }
  }
}

renderDiagrams().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
