<div align="center">
  <br />
  <pre style="font-size: 18px; line-height: 1.2; color: #7c3aed;">
██╗░░░██╗██╗██████╗░███╗░░██╗░█████╗░
██║░░░██║██║██╔══██╗████╗░██║██╔══██╗
██║░░░██║██║██║░░██║██╔██╗██║███████║
██║░░░██║██║██║░░██║██║╚████║██╔══██║
╚██████╔╝██║██████╔╝██║░╚███║██║░░██║
░╚═════╝░╚═╝╚═════╝░╚═╝░░╚══╝╚═╝░░╚═╝
  </pre>
  <p><strong>Reverse-engineer any design system into a Claude-ready skill.<br/>Pure static analysis. No AI. No API keys. No cloud.</strong></p>

  [![npm version](https://img.shields.io/badge/version-2.0.0-7c3aed?style=flat-square)](https://github.com/AdhiHub/UIDNA)
  [![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)]()

</div>

---

## What is UIDNA?

**UIDNA** extracts the complete design DNA from any website, git repo, or local codebase — colors, typography, spacing, animations, components, screenshots, CSS frameworks, and an accessibility audit — packaged into a folder Claude Code reads automatically.

Open the output folder, type `claude`, and ask Claude to build your UI. It already knows the exact design system.

---

## Install

```bash
npm install -g uidna
```

> Requires **Node.js 18+**

For **ultra mode** (full visual extraction with Playwright):

```bash
npm install playwright
npx playwright install chromium
```

---

## Quick Start

```bash
# 1. Extract a design system from any URL
uidna --url https://notion.so

# 2. Open the output folder in Claude Code
cd notion-design && claude

# 3. Ask Claude to build your UI
"Build me a landing page that matches this design system"
```

Claude automatically reads `CLAUDE.md` and `SKILL.md` - no manual setup needed.

---

## Modes

### Default mode - pure static analysis

Extracts HTML, CSS, fonts, color tokens, spacing, and typography. Works on any site, no browser required.

```bash
uidna --url https://linear.app
```

### Ultra mode - full cinematic extraction

Uses Playwright to capture scroll screenshots, interaction diffs, animation detection, layout analysis, and DOM component fingerprinting.

```bash
uidna --url https://linear.app --mode ultra
```

### Dir mode - local project scan

Scans `.css`, `.scss`, `.ts`, `.tsx`, `.js`, `.jsx` for design tokens, Tailwind config, CSS variables, and component patterns.

```bash
uidna --dir ./my-app
```

### Repo mode - clone and scan

Clones any public git repository and runs dir mode automatically.

```bash
uidna --repo https://github.com/org/repo
```

---

## What You Get

| Feature | Default | Ultra |
|---|:---:|:---:|
| Color tokens (CSS vars + JSON) | ✅ | ✅ |
| Typography scale | ✅ | ✅ |
| Spacing grid | ✅ | ✅ |
| Google Fonts bundled locally | ✅ | ✅ |
| `CLAUDE.md` + `SKILL.md` auto-generated | ✅ | ✅ |
| `.skill` ZIP packaged | ✅ | ✅ |
| CSS framework detection | ✅ | ✅ |
| Accessibility audit (contrast, aria, focus) | ✅ | ✅ |
| Component code generation (React/Vue/HTML) | ✅ | ✅ |
| 7 scroll journey screenshots | | ✅ |
| Hover / focus interaction diffs | | ✅ |
| CSS keyframes + animation detection | | ✅ |
| Flex/grid layout extraction | | ✅ |
| DOM component fingerprinting | | ✅ |

---

## Output Structure

```
notion-design/
├── notion-design.skill       # Packaged .skill ZIP
├── SKILL.md                  # Master skill file (auto-loaded by Claude)
├── CLAUDE.md                 # Claude Code project context
├── DESIGN.md                 # Full design system tokens
├── COMPONENTS.md             # Generated React/Vue/HTML code
├── A11Y.md                   # Accessibility audit report
├── FRAMEWORKS.md             # Detected CSS frameworks
├── references/
│   ├── ANIMATIONS.md         # Motion specs and keyframes
│   ├── LAYOUT.md             # Layout containers and grid
│   ├── COMPONENTS.md         # DOM component patterns
│   ├── INTERACTIONS.md       # Hover/focus state diffs
│   └── VISUAL_GUIDE.md       # All screenshots embedded
├── screens/
│   ├── scroll/               # 7 scroll journey screenshots
│   ├── pages/                # Full-page screenshots (ultra)
│   └── sections/             # Section clip screenshots (ultra)
├── tokens/
│   ├── colors.json
│   ├── spacing.json
│   └── typography.json
└── fonts/                    # Bundled Google Fonts (woff2)
```

---

## New Features (v2.0)

### CSS Framework Detection
Automatically detects 20+ CSS frameworks including Bootstrap, Material UI, Chakra, Ant Design, Tailwind, DaisyUI, shadcn/ui, Radix UI, Mantine, Bulma, and more.

### Accessibility Audit
Checks color contrast ratios (WCAG AA/AAA), missing aria-labels, focus indicators, and color-only status indicators. Outputs actionable recommendations.

### Component Code Generation
Generates production-ready React, Vue, or HTML components matching your design system — buttons, cards, inputs, navigation, and modals with your exact colors, spacing, and typography.

---

## All Flags

```
uidna --url <url>           Crawl a live website
uidna --dir <path>          Scan a local project directory
uidna --repo <url>          Clone and scan a git repository

--mode ultra                Enable cinematic extraction (requires Playwright)
--screens <n>               Pages to crawl in ultra mode (default: 5, max: 20)
--out <path>                Output directory (default: ./)
--name <string>             Override the project name
--format design-md|skill|both Output format (default: both)
--no-skill                  Output DESIGN.md only, skip .skill packaging
--quiet                     Suppress logo and banner (scripting)
```

---

## Examples

```bash
# Full ultra extraction - Nothing.tech
uidna --url https://nothing.tech --mode ultra --screens 10

# Scan a local Next.js app
uidna --dir ./my-nextjs-app --name "MyApp"

# Clone and analyze a public repo
uidna --repo https://github.com/vercel/next.js --name "Next.js"

# Silent mode for scripting
uidna --url https://stripe.com --quiet

# Save to a specific directory
uidna --url https://linear.app --out ./design-systems
```

---

## How It Works

UIDNA uses pure static analysis. No AI, no API keys, no cloud - everything runs locally.

- **URL mode** - fetches HTML, crawls all linked CSS files, extracts computed styles via Playwright DOM inspection
- **Dir mode** - scans `.css`, `.scss`, `.ts`, `.tsx`, `.js`, `.jsx` for design tokens, Tailwind config, CSS variables, and component patterns
- **Repo mode** - clones the repo to a temp directory and runs dir mode
- **Ultra mode** - runs Playwright to capture scroll screenshots, detect animation libraries from `window.*` globals, extract `@keyframes` from `document.styleSheets`, capture hover/focus state diffs, fingerprint DOM components

---

## Requirements

- Node.js 18+
- For `--mode ultra`: Playwright (`npm install playwright && npx playwright install chromium`)

---

## License

MIT - built by [AdhiHub](https://github.com/AdhiHub)
