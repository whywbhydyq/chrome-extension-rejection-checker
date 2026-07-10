import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const root=process.cwd();const failures=[];const read=(p)=>readFileSync(join(root,p),'utf8');
const app=read('src/app/App.tsx');
if(app.indexOf('Local ZIP scanner workbench')>app.indexOf('<HeroSection'))failures.push('Scanner workbench must appear before explanatory hero content');
if(app.includes("import { readExtensionZip } from '../core/zipReader'"))failures.push('ZIP parser must be lazy-loaded to keep JSZip out of the initial bundle');
if(!app.includes("await import('../core/zipReader')"))failures.push('ZIP parser dynamic import missing');
const hero=read('src/components/HeroSection.tsx');if(hero.includes('<h1'))failures.push('Only the tool workbench should own the homepage H1');
const csp=read('src/rules/cspRules.ts');if(!csp.includes('Extension CSP contains unsafe-eval'))failures.push('unsafe-eval finding title must name the exact token');
const index=read('index.html');if(!index.includes('Your ZIP is read in the browser'))failures.push('Static fallback must explain the local privacy boundary');
const viteConfig=read('vite.config.ts');for(const needle of ['manualChunks', 'react-vendor']){if(!viteConfig.includes(needle))failures.push(`Vite chunk policy missing: ${needle}`)}
const packageJson=read('package.json');if(packageJson.includes('lucide-react'))failures.push('Unused lucide-react dependency should not be shipped');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log('CWS quality audit passed');
