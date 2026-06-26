import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { runDirMode } from './modes/dir.js';
import { runRepoMode } from './modes/repo.js';
import { runUrlMode } from './modes/url.js';
import { runUltraMode } from './modes/ultra.js';
import { generateDesignMd } from './writers/design-md.js';
import { generateSkill } from './writers/skill.js';
import { CLIOptions, DesignProfile } from './types.js';
import {
  VERSION,
  showLogo,
  showMissionBrief,
  startSpinner,
  succeedSpinner,
  failSpinner,
  infoLine,
  showUltraPlaywrightError,
  showResults,
  runInteractivePrompts,
} from './ui.js';

const program = new Command();

program
  .name('uidna')
  .description('Reverse-engineer any design system into a Claude-ready skill. Pure static analysis — no AI, no API keys.')
  .version(VERSION)
  .option('--dir <path>', 'Scan a local project directory')
  .option('--repo <url>', 'Clone and scan a git repository')
  .option('--url <url>', 'Crawl a live website')
  .option('--out <path>', 'Output directory', './')
  .option('--name <string>', 'Override project name')
  .option('--no-skill', 'Output DESIGN.md only, skip .skill packaging')
  .option('--format <format>', 'Output format: design-md | skill | both', 'both')
  .option('--mode <mode>', 'Extraction mode: default | ultra', 'default')
  .option('--screens <number>', 'Ultra mode: max pages to crawl (default: 5)', '5')
  .option('--quiet', 'Suppress logo and banner (scripting)', false)
  .action(async (opts: CLIOptions) => {
    if (!opts.quiet) await showLogo();

    const modes = [opts.dir, opts.repo, opts.url].filter(Boolean);

    if (modes.length === 0) {
      const answers = await runInteractivePrompts();
      if (!answers) process.exit(0);
      opts.url  = answers.source === 'url'  ? answers.target : undefined;
      opts.dir  = answers.source === 'dir'  ? answers.target : undefined;
      opts.repo = answers.source === 'repo' ? answers.target : undefined;
      opts.mode = answers.mode;
      opts.out  = answers.out || './';
    } else if (modes.length > 1) {
      console.error('  Error: Specify only one of --dir, --repo, or --url\n');
      process.exit(1);
    }

    const target = opts.url || opts.dir || opts.repo || '';
    if (!opts.quiet) showMissionBrief(opts.mode || 'default', target, path.resolve(opts.out));

    try {
      let profile: DesignProfile;
      let screenshotPath: string | null = null;

      const outputDir = path.resolve(opts.out);
      fs.mkdirSync(outputDir, { recursive: true });

      if (opts.dir) {
        const resolvedDir = path.resolve(opts.dir);
        if (!fs.existsSync(resolvedDir)) {
          console.error(`\n  Error: Directory not found: ${resolvedDir}\n`);
          process.exit(1);
        }
        const sp = startSpinner('Scanning local directory...');
        try {
          profile = await runDirMode(resolvedDir, opts.name);
          succeedSpinner(sp, 'Directory scan', `${profile.colors.length} colors · ${profile.components.length} components`);
        } catch (e: any) {
          failSpinner(sp, 'Directory scan', e.message);
          throw e;
        }

      } else if (opts.repo) {
        const sp = startSpinner('Cloning repository...');
        try {
          profile = await runRepoMode(opts.repo, opts.name);
          succeedSpinner(sp, 'Repo clone + scan', `${profile.colors.length} colors · ${profile.components.length} components`);
        } catch (e: any) {
          failSpinner(sp, 'Repo clone', e.message);
          throw e;
        }

      } else {
        const safeName = (opts.name || new URL(opts.url!).hostname.replace(/^www\./, '').split('.')[0])
          .replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const designDir = path.join(outputDir, `${safeName}-design`);
        fs.mkdirSync(path.join(designDir, 'screenshots'), { recursive: true });

        const sp1 = startSpinner('Fetching HTML + CSS...');
        let urlResult: Awaited<ReturnType<typeof runUrlMode>>;
        try {
          urlResult = await runUrlMode(opts.url!, opts.name, designDir);
          const { cssColorCount, cssFontCount, computedColorCount, hadPlaywright } = urlResult;
          const detail = hadPlaywright
            ? `${cssColorCount} CSS colors · ${computedColorCount} computed · ${cssFontCount} fonts`
            : `${cssColorCount} colors · ${cssFontCount} fonts (Playwright not found)`;
          succeedSpinner(sp1, 'CSS + token extraction', detail);
          if (!hadPlaywright) {
            infoLine('Playwright not installed — computed style extraction skipped');
            infoLine('Fix: npm install -g playwright && npx playwright install chromium');
          }
        } catch (e: any) {
          failSpinner(sp1, 'CSS + token extraction', e.message);
          throw e;
        }
        profile = urlResult.profile;
        screenshotPath = urlResult.screenshotPath;
      }

      const isUltra = opts.mode === 'ultra' && !!opts.url;
      let ultraAnimations: import('./types-ultra.js').FullAnimationResult | null = null;

      if (isUltra) {
        const ultraScreens = Math.max(1, Math.min(20, parseInt(opts.screens, 10) || 5));
        const safeName = (opts.name || new URL(opts.url!).hostname.replace(/^www\./, '').split('.')[0])
          .replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const designDir = path.join(path.resolve(opts.out), `${safeName}-design`);

        const { loadPlaywright } = await import('./playwright-loader.js');
        if (!loadPlaywright()) {
          showUltraPlaywrightError();
          infoLine('Continuing without ultra features...');
        } else {
          const spAnim = startSpinner('Capturing scroll journey + animations...');
          try {
            const ultraResult = await runUltraMode(opts.url!, profile, designDir, { screens: ultraScreens });
            ultraAnimations = ultraResult.animations;
            const kf = ultraAnimations.keyframes.length;
            const sf = ultraAnimations.scrollFrames.length;
            const libs = ultraAnimations.libraries.map(l => l.name).join(', ') || 'none';
            succeedSpinner(spAnim, 'Ultra extraction', `${sf} scroll frames · ${kf} keyframes · ${libs}`);
          } catch (e: any) {
            failSpinner(spAnim, 'Ultra extraction', e.message);
            throw e;
          }
        }
      }

      const shouldWriteDesignMd = opts.format === 'design-md' || opts.format === 'both';
      const shouldWriteSkill = opts.skill !== false && (opts.format === 'skill' || opts.format === 'both');

      const designMdContent = generateDesignMd(profile, screenshotPath);
      const safeName = profile.projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const designDir = path.join(path.resolve(opts.out), `${safeName}-design`);
      fs.mkdirSync(designDir, { recursive: true });

      let designMdPath: string | undefined;
      if (shouldWriteDesignMd) {
        const spWrite = startSpinner('Writing DESIGN.md...');
        designMdPath = path.join(designDir, 'DESIGN.md');
        fs.writeFileSync(designMdPath, designMdContent, 'utf-8');
        succeedSpinner(spWrite, 'DESIGN.md', designMdPath);
      }

      let skillFilePath: string | undefined;
      let skillInstalled = false;
      if (shouldWriteSkill) {
        const spSkill = startSpinner('Bundling .skill package...');
        try {
          const result = await generateSkill(profile, designMdContent, path.resolve(opts.out), screenshotPath, ultraAnimations);
          skillFilePath = result.skillFile;
          succeedSpinner(spSkill, '.skill package', skillFilePath);

          const skillFolderName = path.basename(result.skillDir);
          skillInstalled = installSkillForClaude(result.skillDir, skillFolderName);
          writeClaudeMd(result.skillDir, skillFolderName, profile.projectName);
        } catch (e: any) {
          failSpinner(spSkill, '.skill package', e.message);
          throw e;
        }
      }

      showResults({
        profile,
        animations: ultraAnimations ?? undefined,
        skillFilePath,
        designMdPath,
        projectName: safeName,
        skillInstalled,
      });

    } catch (err: any) {
      console.error(`\n  Error: ${err.message || err}\n`);
      process.exit(1);
    }
  });

program.parse();

function writeClaudeMd(designDir: string, safeName: string, projectName: string): void {
  try {
    const claudeMdPath = path.join(designDir, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) return;
    const content = `# ${projectName} Design System

This project uses the **${projectName}** design system extracted by uidna.

## How to use

Read \`SKILL.md\` in this directory for the full design system reference before writing any UI code.

Key files:
- \`SKILL.md\` — master design reference (read this first)
- \`references/DESIGN.md\` — extended tokens and component specs
- \`references/ANIMATIONS.md\` — motion and keyframe specs
- \`references/LAYOUT.md\` — grid and layout containers
- \`references/COMPONENTS.md\` — DOM component patterns
- \`screens/scroll/\` — scroll journey screenshots (study before implementing)

When building any UI, always read SKILL.md first and match colors, fonts, spacing, and motion exactly.
`;
    fs.writeFileSync(claudeMdPath, content, 'utf-8');
  } catch { /* non-fatal */ }
}

function installSkillForClaude(designDir: string, safeName: string): boolean {
  try {
    const skillMdSrc = path.join(designDir, 'SKILL.md');
    if (!fs.existsSync(skillMdSrc)) return false;

    const homeDir = process.env.USERPROFILE || process.env.HOME || '';
    if (!homeDir) return false;

    const destDir = path.join(homeDir, '.claude', 'skills', safeName);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(skillMdSrc, path.join(destDir, 'SKILL.md'));

    return true;
  } catch {
    return false;
  }
}
