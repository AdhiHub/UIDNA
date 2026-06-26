import { A11yAudit, A11yIssue, ColorToken } from '../types';

export function runA11yAudit(
  colors: ColorToken[],
  htmlContent?: string
): A11yAudit {
  const issues: A11yIssue[] = [];
  const contrastRatios: A11yAudit['contrastRatios'] = [];
  let missingAriaLabels = 0;
  let focusableElements = 0;

  // ── Contrast checks ────────────────────────────────────────────────
  const textColors = colors.filter(c => c.role === 'text-primary' || c.role === 'text-muted');
  const bgColors = colors.filter(c => c.role === 'background' || c.role === 'surface');

  for (const text of textColors) {
    for (const bg of bgColors) {
      if (!text.hex || !bg.hex) continue;
      const ratio = getContrastRatio(text.hex, bg.hex);
      const passesAA = ratio >= 4.5;
      const passesAAA = ratio >= 7;

      contrastRatios.push({
        foreground: text.hex,
        background: bg.hex,
        ratio: Math.round(ratio * 100) / 100,
        passesAA,
        passesAAA,
      });

      if (!passesAA) {
        issues.push({
          type: 'contrast',
          severity: 'error',
          message: `Text color ${text.hex} on background ${bg.hex} has contrast ratio ${ratio.toFixed(2)} (needs 4.5:1 for AA)`,
          recommendation: `Darken the text or lighten the background to achieve at least 4.5:1 contrast`,
        });
      }
    }
  }

  // ── HTML checks ────────────────────────────────────────────────────
  if (htmlContent) {
    const lowerHtml = htmlContent.toLowerCase();

    // Count interactive elements without aria-label
    const buttons = (lowerHtml.match(/<button[^>]*>/g) || []).length;
    const inputs = (lowerHtml.match(/<input[^>]*>/g) || []).length;
    const anchors = (lowerHtml.match(/<a[^>]*>/g) || []).length;
    const iframes = (lowerHtml.match(/<iframe[^>]*>/g) || []).length;
    focusableElements = buttons + inputs + anchors + iframes;

    // Check for aria-label on buttons with only icon content
    const iconButtons = htmlContent.match(/<button[^>]*>\s*<[^>]*(icon|svg|img)[^>]*>/gi) || [];
    for (const btn of iconButtons) {
      if (!btn.includes('aria-label') && !btn.includes('aria-labelledby')) {
        missingAriaLabels++;
        issues.push({
          type: 'aria',
          severity: 'warning',
          element: btn.slice(0, 80),
          message: 'Icon-only button missing aria-label',
          recommendation: 'Add aria-label describing the button action',
        });
      }
    }

    // Check iframes for title/aria-label
    if (iframes > 0) {
      const iframeTags = htmlContent.match(/<iframe[^>]*>/gi) || [];
      for (const iframe of iframeTags) {
        if (!iframe.includes('title=') && !iframe.includes('aria-label')) {
          issues.push({
            type: 'aria',
            severity: 'warning',
            element: iframe.slice(0, 80),
            message: 'iframe missing descriptive title',
            recommendation: 'Add title or aria-label attribute describing the iframe content',
          });
        }
      }
    }

    // Check for missing form labels
    if (inputs > 0) {
      const inputTags = htmlContent.match(/<input[^>]*>/gi) || [];
      for (const input of inputTags) {
        if (input.includes('type="hidden"') || input.includes("type='hidden'")) continue;
        if (!input.includes('aria-label') && !input.includes('aria-labelledby') && !input.includes('placeholder=')) {
          issues.push({
            type: 'aria',
            severity: 'info',
            element: input.slice(0, 80),
            message: 'Input missing accessible label',
            recommendation: 'Add aria-label, aria-labelledby, or associated <label> element',
          });
        }
      }
    }

    // Detect color-only indicators (links without underlines, etc.)
    const linksWithoutUnderline = htmlContent.match(/<a[^>]*style="[^"]*color:[^"]*"[^>]*>/gi) || [];
    for (const link of linksWithoutUnderline) {
      if (!link.includes('text-decoration') && !link.includes('underline')) {
        issues.push({
          type: 'color',
          severity: 'warning',
          message: 'Link uses color-only differentiation — consider adding underline',
          recommendation: 'Add text-decoration: underline on hover or use a secondary visual indicator',
        });
      }
    }
  }

  // ── Color-only info detection ──────────────────────────────────────
  const hasOnlyColorStatus = colors.some(c =>
    (c.role === 'danger' || c.role === 'success' || c.role === 'warning') &&
    !c.name?.toLowerCase().includes('icon')
  );
  if (hasOnlyColorStatus && issues.length === 0) {
    issues.push({
      type: 'color',
      severity: 'info',
      message: 'Status is conveyed through color alone — consider adding icons or text labels',
      recommendation: 'Pair status colors with icons (e.g., checkmark for success, X for error)',
    });
  }

  // Compute score
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  let score = 100;
  score -= errorCount * 15;
  score -= warningCount * 5;
  score -= infoCount * 2;
  score = Math.max(0, Math.min(100, score));

  return { score, issues, contrastRatios, missingAriaLabels, focusableElements };
}

// ── Contrast Ratio Calculator ───────────────────────────────────────────

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
