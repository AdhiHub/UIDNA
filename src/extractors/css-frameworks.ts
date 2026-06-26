import * as fs from 'fs';
import * as path from 'path';
import { CSSFramework } from '../types';

interface FrameworkMatcher {
  name: string;
  pkg: string;
  markers: string[];
  markerType: 'file' | 'dependency' | 'class' | 'variable';
}

const FRAMEWORKS: FrameworkMatcher[] = [
  { name: 'Bootstrap', pkg: 'bootstrap', markers: ['bootstrap.css', 'bootstrap.min.css'], markerType: 'dependency' },
  { name: 'Material UI', pkg: '@mui/material', markers: ['MuiButton', 'MuiCard', 'MuiTextField'], markerType: 'variable' },
  { name: 'Chakra UI', pkg: '@chakra-ui/react', markers: ['chakra-ui', 'ChakraProvider'], markerType: 'dependency' },
  { name: 'Ant Design', pkg: 'antd', markers: ['ant-btn', 'ant-card', 'ant-input'], markerType: 'class' },
  { name: 'PrimeNG', pkg: 'primeng', markers: ['p-button', 'p-card', 'p-input'], markerType: 'class' },
  { name: 'PrimeReact', pkg: 'primereact', markers: ['p-button', 'p-card'], markerType: 'class' },
  { name: 'Semantic UI', pkg: 'semantic-ui-react', markers: ['ui button', 'ui card', 'ui container'], markerType: 'class' },
  { name: 'Bulma', pkg: 'bulma', markers: ['button is-', 'card', 'navbar'], markerType: 'class' },
  { name: 'Foundation', pkg: 'foundation-sites', markers: ['foundation.css'], markerType: 'dependency' },
  { name: 'Tailwind CSS', pkg: 'tailwindcss', markers: ['tailwindcss'], markerType: 'dependency' },
  { name: 'DaisyUI', pkg: 'daisyui', markers: ['daisyui'], markerType: 'dependency' },
  { name: 'shadcn/ui', pkg: 'shadcn', markers: ['@radix-ui', 'cn(', 'class-variance-authority'], markerType: 'dependency' },
  { name: 'Radix UI', pkg: '@radix-ui/react', markers: ['@radix-ui'], markerType: 'dependency' },
  { name: 'Headless UI', pkg: '@headlessui/react', markers: ['@headlessui'], markerType: 'dependency' },
  { name: 'Mantine', pkg: '@mantine/core', markers: ['@mantine/core'], markerType: 'dependency' },
  { name: 'Pico CSS', pkg: '@picocss/pico', markers: ['@picocss/pico'], markerType: 'dependency' },
  { name: 'NES.css', pkg: 'nes.css', markers: ['nes-'], markerType: 'class' },
  { name: 'Water.css', pkg: 'water.css', markers: ['water.css'], markerType: 'dependency' },
  { name: 'MVP.css', pkg: 'mvp.css', markers: ['mvp.css'], markerType: 'dependency' },
  { name: 'Open Props', pkg: 'open-props', markers: ['open-props'], markerType: 'dependency' },
];

export function detectCSSFrameworks(
  projectDir: string,
  htmlContent?: string
): CSSFramework[] {
  const results: CSSFramework[] = [];
  const pkgPath = path.join(projectDir, 'package.json');
  let deps: Record<string, string> = {};

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      deps = { ...pkg.dependencies, ...pkg.devDependencies };
    } catch { /* ignore */ }
  }

  for (const fw of FRAMEWORKS) {
    let detected = false;
    let version: string | undefined;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (fw.markerType === 'dependency') {
      for (const pkgName of [fw.pkg, ...fw.markers]) {
        if (deps[pkgName]) {
          detected = true;
          version = deps[pkgName].replace(/[\^~>=<]/g, '');
          confidence = 'high';
          break;
        }
      }
    }

    if (!detected && htmlContent && fw.markerType === 'class') {
      for (const marker of fw.markers) {
        if (htmlContent.includes(marker)) {
          detected = true;
          confidence = 'medium';
          break;
        }
      }
    }

    if (!detected && fw.markerType === 'variable') {
      if (deps[fw.pkg]) {
        detected = true;
        version = deps[fw.pkg].replace(/[\^~>=<]/g, '');
        confidence = 'high';
      } else {
        const cssDir = path.join(projectDir, 'src');
        if (fs.existsSync(cssDir)) {
          const files = findAllFiles(cssDir, '.css', '.scss', '.tsx', '.jsx');
          for (const file of files) {
            try {
              const content = fs.readFileSync(file, 'utf-8');
              for (const marker of fw.markers) {
                if (content.includes(marker)) {
                  detected = true;
                  confidence = 'medium';
                  break;
                }
              }
            } catch { /* skip unreadable */ }
            if (detected) break;
          }
        }
      }
    }

    results.push({ name: fw.name, package: fw.pkg, detected, version, confidence });
  }

  return results.filter(f => f.detected);
}

function findAllFiles(dir: string, ...exts: string[]): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
        results.push(fullPath);
      } else if (entry.isDirectory()) {
        results.push(...findAllFiles(fullPath, ...exts));
      }
    }
  } catch { /* permission issues */ }
  return results;
}
