// Optional offline preview generated from the same deployable source files.
// No server, bundler, dependencies, or external assets are needed to open it.
import {readFile,writeFile} from 'node:fs/promises';
const read=name=>readFile(new URL(`./dist/${name}`,import.meta.url),'utf8');
let [html,css,core,app,icon]=await Promise.all(['index.html','styles.css','core.js','app.js','favicon.svg'].map(read));
core=core.replace(/^export /gm,'');
app=app.replace(/^import .* from '\.\/core\.js';\s*/,'');
html=html.replace('<link rel="stylesheet" href="./styles.css">',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="./app.js"></script>',()=>`<script type="module">${core}\n${app}</script>`)
  .replace('href="./favicon.svg"',()=>`href="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}"`);
await writeFile(new URL('./preview.html',import.meta.url),html);
console.log('Generated preview.html from dist/; open it in a modern browser.');
