import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import { SingleBar, Presets } from 'cli-progress';
import * as path from 'path';
import type { DesignProfile } from './types';
import type { FullAnimationResult } from './types-ultra';

export const VERSION = '2.0.0';

// ── Brand Colors ─────────────────────────────────────────────────────────
const brand = {
  primary: chalk.hex('#7c3aed'),
  secondary: chalk.hex('#a78bfa'),
  accent: chalk.hex('#f59e0b'),
  success: chalk.hex('#10b981'),
  error: chalk.hex('#ef4444'),
  info: chalk.hex('#3b82f6'),
  muted: chalk.dim,
  white: chalk.white,
  bold: chalk.bold,
};

function padRaw(str: string, width: number): string {
  const raw = str.replace(/\x1b\[\d+m/g, '');
  return str + ' '.repeat(Math.max(0, width - raw.length));
}

// ── Logo ─────────────────────────────────────────────────────────────────

export async function showLogo(): Promise<void> {
  const P = brand.primary;
  const S = brand.secondary;
  const A = brand.accent;
  const M = brand.muted;

  const logo = `
${P('█▀█ █ █▄ █ █▄ █ ▄▀█')}  ${S('╲')}
${P('█▀▄ █ █ ▀█ █ ▀█ █▀█')}  ${S('╱')}  ${M('v' + VERSION)}

${M('Reverse-engineer any design system into a Claude-ready skill.')}
${M('Pure static analysis. No AI. No API keys. No cloud.')}

${A('\u25B6')}  ${M('Extract from:')}  ${brand.white('--url <site>')}  ${M('|')}  ${brand.white('--dir <path>')}  ${M('|')}  ${brand.white('--repo <url>')}
`;
  console.log(logo);

  const divider = M('\u2500'.repeat(72));
  console.log(`  ${divider}\n`);
}

// ── Mission Brief ────────────────────────────────────────────────────────

export function showMissionBrief(mode: string, target: string, outputDir: string): void {
  const P = brand.primary;
  const A = brand.accent;

  const lines = [
    `  ${P('\u25B8')}  Mode:   ${brand.white.bold(mode === 'ultra' ? 'ultra (cinematic)' : 'default (static)')}`,
    `  ${P('\u25B8')}  Target: ${brand.white(target || '(interactive)')}`,
    `  ${P('\u25B8')}  Output: ${brand.muted(outputDir)}`,
  ];

  console.log(boxen(lines.join('\n'), {
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: brand.muted('') ? undefined : 'magenta',
    width: 72,
  }));
  console.log('');
}

// ── Spinners ─────────────────────────────────────────────────────────────

export function startSpinner(text: string): Ora {
  return ora({
    text: brand.white(text),
    color: 'magenta',
    spinner: 'dots',
  }).start();
}

export function succeedSpinner(spinner: Ora, label: string, result: string): void {
  spinner.stopAndPersist({
    symbol: brand.success('\u2713'),
    text: `${brand.bold(label)}  ${brand.muted(result)}`,
  });
}

export function failSpinner(spinner: Ora, label: string, error: string): void {
  spinner.stopAndPersist({
    symbol: brand.error('\u2717'),
    text: `${brand.bold(label)}  ${brand.error(error)}`,
  });
}

export function infoLine(message: string): void {
  console.log(`  ${brand.info('\u25CB')}  ${brand.muted(message)}`);
}

export function warnLine(message: string): void {
  console.log(`  ${brand.accent('\u26A0')}  ${brand.muted(message)}`);
}

// ── Progress Bar ─────────────────────────────────────────────────────────

export function createPageBar(total: number): SingleBar {
  const bar = new SingleBar({
    format:
      `  ${brand.white('Crawling')}  ${brand.secondary('[{bar}]')}` +
      ` ${brand.white('{value}/{total}')}  ${brand.muted('{percentage}%')}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
  }, Presets.shades_classic);
  bar.start(total, 0);
  return bar;
}

// ── Ultra Playwright Error ───────────────────────────────────────────────

export function showUltraPlaywrightError(): void {
  console.log('');
  console.log(boxen(
    `${brand.error(brand.bold('Ultra mode requires Playwright.'))}\n\n` +
    `${brand.white('Run:')} ${brand.info('npm install -g playwright')}${brand.muted(' && ')}${brand.info('npx playwright install chromium')}`,
    {
      padding: { left: 1, right: 1, top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor: 'red',
      width: 72,
    }
  ));
  console.log('');
}

// ── Results Panel ────────────────────────────────────────────────────────

interface ResultsData {
  profile: DesignProfile;
  animations?: FullAnimationResult;
  skillFilePath?: string;
  designMdPath?: string;
  projectName: string;
  skillInstalled?: boolean;
}

export function showResults(data: ResultsData): void {
  const { profile, animations, skillFilePath, designMdPath, projectName, skillInstalled } = data;
  const fontCount = new Set(profile.typography.map(t => t.fontFamily)).size;
  const framework = profile.frameworks.map(f => f.name).join(', ') || 'none detected';
  const darkMode = profile.designTraits.hasDarkMode ? 'detected' : 'not detected';

  const L = (label: string) => brand.secondary(padRaw(label, 20));
  const V = (val: string) => brand.white.bold(val);

  const rows: string[] = [
    `  ${L('Colors')}       ${V(String(profile.colors.length))}`,
    `  ${L('Fonts')}        ${V(String(fontCount))} families`,
    `  ${L('Spacing')}      ${V(String(profile.spacing.base))}px base grid`,
    `  ${L('Components')}   ${V(String(profile.components.length))} patterns`,
    `  ${L('Animations')}   ${V(String(profile.animations.length))} detected`,
    `  ${L('Framework')}    ${V(framework)}`,
    `  ${L('Dark Mode')}    ${V(darkMode)}`,
  ];

  if (animations) {
    if (animations.keyframes.length > 0)
      rows.push(`  ${L('Keyframes')}     ${V(String(animations.keyframes.length))} extracted`);
    if (animations.scrollFrames.length > 0)
      rows.push(`  ${L('Scroll Frames')} ${V(String(animations.scrollFrames.length))} captured`);
    if (animations.libraries.length > 0)
      rows.push(`  ${L('Anim Stack')}    ${V(animations.libraries.map(l => l.name).join(', '))}`);
    if (animations.videos.length > 0) {
      const bg = animations.videos.filter(v => v.role === 'background').length;
      rows.push(`  ${L('Videos')}        ${V(String(animations.videos.length))} (${bg} bg)`);
    }
  }

  console.log('');
  console.log(boxen(rows.join('\n'), {
    padding: { left: 0, right: 1, top: 0, bottom: 0 },
    borderStyle: 'double',
    borderColor: 'magenta',
    width: 70,
    title: brand.bold(brand.primary(' Extraction Complete ')),
  }));
  console.log('');

  const G = brand.success;
  const rel = (p: string) => './' + path.relative(process.cwd(), p).replace(/\\/g, '/');
  const outRows: string[] = [];
  if (designMdPath) outRows.push(`  ${G(padRaw('DESIGN.md', 16))} ${brand.muted(rel(designMdPath))}`);
  if (skillFilePath) outRows.push(`  ${G(padRaw(`${projectName}.skill`, 16))} ${brand.muted(rel(skillFilePath))}`);

  if (outRows.length > 0) {
    console.log(boxen(outRows.join('\n'), {
      padding: { left: 0, right: 1, top: 0, bottom: 0 },
      borderStyle: 'round',
      borderColor: 'green',
      width: 70,
      title: brand.bold(' Output Files '),
    }));
    console.log('');
  }

  const nextSteps = [
    brand.muted('  Open inside the design folder and ask Claude:'),
    '',
    `    ${brand.info('cd ' + projectName + '-design && claude')}`,
    '',
    `    ${brand.secondary('"Build me a UI that matches this design system"')}`,
  ].join('\n');

  console.log(boxen(nextSteps, {
    padding: { left: 0, right: 1, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: 'green',
    width: 70,
    title: brand.bold(' Next Steps '),
  }));
  console.log('');
}

// ── Interactive Prompts ─────────────────────────────────────────────────

export interface InteractiveAnswers {
  source: 'url' | 'dir' | 'repo';
  target: string;
  mode: 'default' | 'ultra';
  out: string;
}

export async function runInteractivePrompts(): Promise<InteractiveAnswers | null> {
  const prompts = (await import('prompts')).default;

  const answers = await prompts(
    [
      {
        type: 'select',
        name: 'source',
        message: brand.white('What do you want to extract from?'),
        choices: [
          { title: `${brand.info('\u25B8')} ${brand.white('Website URL')}     ${brand.muted('--url https://yoursite.com')}`, value: 'url' },
          { title: `${brand.success('\u25B8')} ${brand.white('Local directory')} ${brand.muted('--dir ./my-app')}`, value: 'dir' },
          { title: `${brand.secondary('\u25B8')} ${brand.white('Git repository')}  ${brand.muted('--repo https://github.com/org/repo')}`, value: 'repo' },
        ],
      },
      {
        type: 'text',
        name: 'target',
        message: (prev: string) =>
          prev === 'url'  ? brand.white('Enter the website URL:') :
          prev === 'dir'  ? brand.white('Enter the directory path:') :
                            brand.white('Enter the git repo URL:'),
      },
      {
        type: 'select',
        name: 'mode',
        message: brand.white('Extraction mode?'),
        choices: [
          { title: `${brand.white('Default')} ${brand.muted('-- fast, CSS + tokens, no browser')}`, value: 'default' },
          { title: `${brand.secondary('Ultra')} ${brand.muted('  -- cinematic, scroll frames, requires Playwright')}`, value: 'ultra' },
        ],
      },
      {
        type: 'text',
        name: 'out',
        message: brand.white('Output directory?'),
        initial: './',
      },
    ],
    { onCancel: () => process.exit(0) }
  ) as InteractiveAnswers;

  if (!answers.source || !answers.target) return null;
  console.log('');
  return answers;
}
